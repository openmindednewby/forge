"""HuggingFace Diffusers backend for local image generation."""

from __future__ import annotations

import gc
import logging
import random
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from forge.backends.base import BaseBackend
from forge.backends.registry import register_backend
from forge.config import Settings
from forge.schemas.generation import GenerateRequest, GenerationMode

logger = logging.getLogger("forge.backends.diffusers")

try:
    import torch
    from diffusers import (
        AutoPipelineForText2Image,
        DPMSolverMultistepScheduler,
        EulerAncestralDiscreteScheduler,
        EulerDiscreteScheduler,
        StableDiffusionPipeline,
        StableDiffusionXLPipeline,
    )

    HAS_DIFFUSERS = True
except ImportError:
    HAS_DIFFUSERS = False

if not HAS_DIFFUSERS:
    raise ImportError("diffusers not installed")

SCHEDULER_MAP = {
    "euler_a": "EulerAncestralDiscreteScheduler",
    "euler": "EulerDiscreteScheduler",
    "dpm++_2m": "DPMSolverMultistepScheduler",
    "dpm++_2m_karras": "DPMSolverMultistepScheduler",
}

MAX_SEED = 2**32 - 1


@register_backend("diffusers")
class DiffusersBackend(BaseBackend):
    """Direct HuggingFace diffusers backend with VRAM management."""

    name = "diffusers"

    def __init__(self) -> None:
        self._pipe = None
        self._current_model: str = ""
        self._settings: Settings | None = None
        self._device: str = "cpu"
        self._dtype = None
        self._models_dir: Path | None = None

    async def initialize(self, settings: Settings) -> None:
        self._settings = settings
        self._device = settings.gpu.device
        self._models_dir = settings.paths.resolved_models / "checkpoints"

        if torch.cuda.is_available() and "cuda" in self._device:
            self._dtype = torch.float16 if settings.gpu.half_precision else torch.float32
            logger.info(
                "CUDA available: %s, VRAM: %dMB",
                torch.cuda.get_device_name(0),
                torch.cuda.get_device_properties(0).total_mem // (1024 * 1024),
            )
        else:
            self._device = "cpu"
            self._dtype = torch.float32
            logger.info("Running on CPU")

    async def shutdown(self) -> None:
        await self.unload_model()

    async def health_check(self) -> dict[str, Any]:
        gpu_ok = torch.cuda.is_available() if "cuda" in self._device else True
        return {
            "status": "healthy" if gpu_ok else "degraded",
            "device": self._device,
            "model_loaded": self._current_model or None,
            "cuda_available": torch.cuda.is_available(),
        }

    async def generate(
        self, params: GenerateRequest, job_id: str
    ) -> AsyncIterator[dict[str, Any]]:
        if not self._pipe:
            if not params.model_id:
                models = self.list_available_models()
                if not models:
                    raise RuntimeError(
                        "No models found. Place .safetensors files in "
                        f"{self._models_dir}"
                    )
                params.model_id = models[0]["id"]
            await self.load_model(params.model_id)

        seed = params.seed if params.seed >= 0 else random.randint(0, MAX_SEED)
        generator = torch.Generator(device=self._device).manual_seed(seed)

        # Set scheduler
        self._set_scheduler(params.sampler)

        step_count = 0

        def callback(pipe, step, timestep, callback_kwargs):
            nonlocal step_count
            step_count = step + 1
            return callback_kwargs

        # Run generation
        import asyncio

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self._pipe(
                prompt=params.prompt,
                negative_prompt=params.negative_prompt or None,
                width=params.width,
                height=params.height,
                num_inference_steps=params.steps,
                guidance_scale=params.cfg_scale,
                generator=generator,
                num_images_per_prompt=params.batch_size,
                callback_on_step_end=callback,
            ),
        )

        # Save images
        from forge.storage.images import save_generation_images

        images_info = await save_generation_images(
            images=result.images,
            job_id=job_id,
            seed=seed,
            outputs_dir=self._settings.paths.resolved_outputs,
        )

        # Yield progress at 100%
        yield {
            "type": "progress",
            "step": params.steps,
            "total_steps": params.steps,
            "percentage": 100.0,
        }

        yield {"type": "result", "images": images_info}

    async def load_model(self, model_id: str) -> None:
        if model_id == self._current_model and self._pipe is not None:
            return

        await self.unload_model()
        logger.info("Loading model: %s", model_id)

        model_path = self._resolve_model_path(model_id)

        pipe_kwargs = {
            "torch_dtype": self._dtype,
            "use_safetensors": True,
        }

        if model_path.suffix in (".safetensors", ".ckpt"):
            # Try SDXL first, fall back to SD 1.5
            try:
                self._pipe = StableDiffusionXLPipeline.from_single_file(
                    str(model_path), **pipe_kwargs
                )
            except Exception:
                self._pipe = StableDiffusionPipeline.from_single_file(
                    str(model_path), **pipe_kwargs
                )
        else:
            # HuggingFace model ID or directory
            self._pipe = AutoPipelineForText2Image.from_pretrained(
                str(model_path), **pipe_kwargs
            )

        self._pipe = self._pipe.to(self._device)

        # VRAM optimizations
        if self._settings.gpu.cpu_offload:
            self._pipe.enable_model_cpu_offload()

        if self._settings.gpu.attention_slicing:
            self._pipe.enable_attention_slicing()

        if self._settings.gpu.vae_tiling:
            self._pipe.enable_vae_tiling()

        self._current_model = model_id
        logger.info("Model loaded: %s", model_id)

    async def unload_model(self) -> None:
        if self._pipe is not None:
            del self._pipe
            self._pipe = None
            self._current_model = ""
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()
            logger.info("Model unloaded")

    def list_available_models(self) -> list[dict[str, Any]]:
        if not self._models_dir or not self._models_dir.exists():
            return []

        models = []
        for ext in ("*.safetensors", "*.ckpt"):
            for path in self._models_dir.glob(ext):
                models.append(
                    {
                        "id": path.name,
                        "name": path.stem,
                        "filename": path.name,
                        "type": "checkpoint",
                        "size_bytes": path.stat().st_size,
                    }
                )
        return sorted(models, key=lambda m: m["name"].lower())

    def get_supported_modes(self) -> list[GenerationMode]:
        return [GenerationMode.TXT2IMG]

    async def get_system_info(self) -> dict[str, Any]:
        info: dict[str, Any] = {
            "device": self._device,
            "dtype": str(self._dtype),
            "model_loaded": self._current_model or None,
        }
        if torch.cuda.is_available():
            info["gpu_name"] = torch.cuda.get_device_name(0)
            props = torch.cuda.get_device_properties(0)
            mb = 1024 * 1024
            info["vram_total_mb"] = props.total_mem // mb
            info["vram_used_mb"] = torch.cuda.memory_allocated(0) // mb
            info["vram_free_mb"] = (props.total_mem - torch.cuda.memory_allocated(0)) // mb
            info["cuda_version"] = torch.version.cuda or ""
        return info

    def _resolve_model_path(self, model_id: str) -> Path:
        """Resolve a model ID to an absolute path."""
        # If it's already an absolute path
        p = Path(model_id)
        if p.is_absolute() and p.exists():
            return p

        # Check in models directory
        candidate = self._models_dir / model_id
        if candidate.exists():
            return candidate

        # Maybe it's a HuggingFace model ID
        return p

    def _set_scheduler(self, sampler: str) -> None:
        """Set the diffusion scheduler/sampler."""
        if not self._pipe:
            return

        scheduler_config = self._pipe.scheduler.config

        if sampler in ("euler_a", "euler_ancestral"):
            self._pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(
                scheduler_config
            )
        elif sampler == "euler":
            self._pipe.scheduler = EulerDiscreteScheduler.from_config(scheduler_config)
        elif sampler in ("dpm++_2m", "dpm++_2m_karras"):
            self._pipe.scheduler = DPMSolverMultistepScheduler.from_config(
                scheduler_config, use_karras_sigmas="karras" in sampler
            )
