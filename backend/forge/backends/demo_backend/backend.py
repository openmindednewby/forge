"""Demo backend — generates procedural images using Pillow (no GPU needed).

Useful for development, testing, and verifying the full pipeline works
without requiring torch, diffusers, or a GPU.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import random
from collections.abc import AsyncIterator
from typing import Any

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from forge.backends.base import BaseBackend
from forge.backends.registry import register_backend
from forge.config import Settings
from forge.schemas.generation import GenerateRequest, GenerationMode

logger = logging.getLogger("forge.backends.demo")

MAX_SEED = 2**32 - 1


def _prompt_to_seed(prompt: str, seed: int) -> int:
    """Derive a deterministic seed from the prompt text."""
    if seed >= 0:
        return seed
    return int(hashlib.md5(prompt.encode()).hexdigest()[:8], 16)


def _seed_color(seed: int, offset: int = 0) -> tuple[int, int, int]:
    """Derive a color from a seed value."""
    rng = random.Random(seed + offset)
    return (rng.randint(60, 240), rng.randint(60, 240), rng.randint(60, 240))


def _generate_image(params: GenerateRequest, seed: int) -> Image.Image:
    """Generate a procedural image based on the prompt and parameters."""
    w, h = params.width, params.height
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    rng = random.Random(seed)

    # Background gradient
    c1 = _seed_color(seed, 0)
    c2 = _seed_color(seed, 1)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Draw shapes based on prompt hash
    num_shapes = rng.randint(3, 8)
    for i in range(num_shapes):
        shape_color = _seed_color(seed, i + 10)
        alpha_color = (*shape_color, rng.randint(80, 200))
        cx = rng.randint(0, w)
        cy = rng.randint(0, h)
        size = rng.randint(w // 8, w // 3)
        shape_type = rng.choice(["circle", "rect", "triangle"])

        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        odraw = ImageDraw.Draw(overlay)

        if shape_type == "circle":
            odraw.ellipse(
                [cx - size, cy - size, cx + size, cy + size],
                fill=alpha_color,
            )
        elif shape_type == "rect":
            odraw.rectangle(
                [cx - size, cy - size // 2, cx + size, cy + size // 2],
                fill=alpha_color,
            )
        else:
            points = [
                (cx, cy - size),
                (cx - size, cy + size),
                (cx + size, cy + size),
            ]
            odraw.polygon(points, fill=alpha_color)

        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # Apply a soft blur for a painterly effect
    img = img.filter(ImageFilter.GaussianBlur(radius=2))

    # Overlay prompt text at the bottom
    draw = ImageDraw.Draw(img)
    text = params.prompt[:80] if params.prompt else "Demo"
    try:
        font = ImageFont.truetype("arial", size=max(14, w // 32))
    except OSError:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (w - tw) // 2
    ty = h - th - 20

    # Text background
    draw.rectangle([tx - 8, ty - 4, tx + tw + 8, ty + th + 4], fill=(0, 0, 0, 160))
    draw.text((tx, ty), text, fill=(255, 255, 255), font=font)

    # Seed watermark
    seed_text = f"seed: {seed}"
    draw.text((8, 8), seed_text, fill=(255, 255, 255, 128))

    return img


@register_backend("demo")
class DemoBackend(BaseBackend):
    """Generates procedural images using Pillow. No GPU or models needed."""

    name = "demo"

    def __init__(self) -> None:
        self._settings: Settings | None = None

    async def initialize(self, settings: Settings) -> None:
        self._settings = settings
        logger.info("Demo backend initialized (no GPU required)")

    async def shutdown(self) -> None:
        pass

    async def health_check(self) -> dict[str, Any]:
        return {"status": "healthy", "backend": "demo", "gpu_required": False}

    async def generate(
        self, params: GenerateRequest, job_id: str
    ) -> AsyncIterator[dict[str, Any]]:
        seed = params.seed if params.seed >= 0 else random.randint(0, MAX_SEED)
        total_steps = params.steps

        # Simulate step-by-step progress
        for step in range(1, total_steps + 1):
            # Simulate ~50ms per step for realistic timing
            await asyncio.sleep(0.05)

            percentage = round(step / total_steps * 100, 1)
            yield {
                "type": "progress",
                "step": step,
                "total_steps": total_steps,
                "percentage": percentage,
            }

        # Generate the image
        loop = asyncio.get_event_loop()
        img = await loop.run_in_executor(None, _generate_image, params, seed)

        # Save via storage module
        from forge.storage.images import save_generation_images

        images_info = await save_generation_images(
            images=[img],
            job_id=job_id,
            seed=seed,
            outputs_dir=self._settings.paths.resolved_outputs,
        )

        yield {"type": "result", "images": images_info}

    async def load_model(self, model_id: str) -> None:
        logger.info("Demo backend: load_model('%s') is a no-op", model_id)

    async def unload_model(self) -> None:
        pass

    def list_available_models(self) -> list[dict[str, Any]]:
        return [
            {
                "id": "demo-model",
                "name": "Demo (Procedural)",
                "filename": "demo-model",
                "type": "demo",
                "size_bytes": 0,
            }
        ]

    def get_supported_modes(self) -> list[GenerationMode]:
        return [GenerationMode.TXT2IMG]

    async def get_system_info(self) -> dict[str, Any]:
        return {
            "backend": "demo",
            "device": "cpu",
            "gpu_required": False,
            "note": "Procedural generation (Pillow). "
            "Install torch + diffusers for real AI generation.",
        }
