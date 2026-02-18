"""System info schemas."""

from __future__ import annotations

from pydantic import BaseModel


class GPUInfo(BaseModel):
    name: str = "Unknown"
    vram_total_mb: int = 0
    vram_used_mb: int = 0
    vram_free_mb: int = 0
    cuda_version: str = ""


class SystemInfoResponse(BaseModel):
    version: str
    backend: str
    gpu: GPUInfo
    models_loaded: list[str] = []
    queue_length: int = 0
    python_version: str = ""
