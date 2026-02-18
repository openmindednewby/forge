"""Model manager — scan, metadata extraction, model listing."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger("forge.models")

MODEL_EXTENSIONS = {".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".onnx"}

MODEL_DIRS = {
    "checkpoints": "checkpoint",
    "loras": "lora",
    "vaes": "vae",
    "controlnet": "controlnet",
    "upscalers": "upscaler",
}


class ModelManager:
    """Scans model directories and provides model metadata."""

    def __init__(self, models_dir: Path) -> None:
        self._models_dir = models_dir

    def scan_all(self) -> list[dict[str, Any]]:
        """Scan all model directories and return model info."""
        models = []
        for dir_name, model_type in MODEL_DIRS.items():
            subdir = self._models_dir / dir_name
            if not subdir.exists():
                continue
            for path in subdir.iterdir():
                if path.suffix.lower() in MODEL_EXTENSIONS:
                    models.append(self._model_info(path, model_type))
        return sorted(models, key=lambda m: m["name"].lower())

    def scan_type(self, model_type: str) -> list[dict[str, Any]]:
        """Scan a specific model type directory."""
        reverse_map = {v: k for k, v in MODEL_DIRS.items()}
        dir_name = reverse_map.get(model_type, model_type)
        subdir = self._models_dir / dir_name
        if not subdir.exists():
            return []

        models = []
        for path in subdir.iterdir():
            if path.suffix.lower() in MODEL_EXTENSIONS:
                models.append(self._model_info(path, model_type))
        return sorted(models, key=lambda m: m["name"].lower())

    def _model_info(self, path: Path, model_type: str) -> dict[str, Any]:
        return {
            "id": path.name,
            "name": path.stem,
            "filename": path.name,
            "type": model_type,
            "size_bytes": path.stat().st_size,
            "hash": "",
            "metadata": {},
        }
