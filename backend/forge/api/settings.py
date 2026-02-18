"""Settings API — read/update configuration."""

from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(tags=["settings"])


@router.get("/settings")
async def get_settings(request: Request):
    """Get current configuration."""
    settings = request.app.state.settings
    return {
        "server": settings.server.model_dump(),
        "gpu": settings.gpu.model_dump(),
        "generation": settings.generation.model_dump(),
        "backend": settings.backend.model_dump(),
    }


@router.put("/settings")
async def update_settings(updates: dict, request: Request):
    """Update configuration (runtime only, does not persist to forge.yaml)."""
    settings = request.app.state.settings

    if "gpu" in updates:
        for key, value in updates["gpu"].items():
            if hasattr(settings.gpu, key):
                setattr(settings.gpu, key, value)

    if "generation" in updates:
        for key, value in updates["generation"].items():
            if hasattr(settings.generation, key):
                setattr(settings.generation, key, value)

    return {"status": "updated"}
