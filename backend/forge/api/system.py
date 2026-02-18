"""System API — health check, GPU info."""

from __future__ import annotations

import sys

from fastapi import APIRouter, Request

from forge.schemas.system import GPUInfo, SystemInfoResponse

router = APIRouter(tags=["system"])


@router.get("/system/info", response_model=SystemInfoResponse)
async def get_system_info(request: Request):
    """Return system and GPU information."""
    settings = request.app.state.settings
    worker = request.app.state.worker
    job_queue = request.app.state.job_queue

    gpu_info = GPUInfo()
    models_loaded = []

    if worker._backend:
        try:
            backend_info = await worker._backend.get_system_info()
            gpu_info = GPUInfo(
                name=backend_info.get("gpu_name", "Unknown"),
                vram_total_mb=backend_info.get("vram_total_mb", 0),
                vram_used_mb=backend_info.get("vram_used_mb", 0),
                vram_free_mb=backend_info.get("vram_free_mb", 0),
                cuda_version=backend_info.get("cuda_version", ""),
            )
            if backend_info.get("model_loaded"):
                models_loaded.append(backend_info["model_loaded"])
        except Exception:
            pass

    return SystemInfoResponse(
        version="0.1.0",
        backend=settings.backend.active,
        gpu=gpu_info,
        models_loaded=models_loaded,
        queue_length=job_queue.size,
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
    )


@router.get("/system/health")
async def health_check():
    """Basic health check."""
    return {"status": "ok"}
