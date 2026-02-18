"""Models API — list and manage available models."""

from __future__ import annotations

from fastapi import APIRouter, Request

from forge.models.manager import ModelManager
from forge.schemas.models import ModelInfo, ModelListResponse

router = APIRouter(tags=["models"])


@router.get("/models", response_model=ModelListResponse)
async def list_models(request: Request, type: str | None = None):
    """List all available models, optionally filtered by type."""
    settings = request.app.state.settings
    manager = ModelManager(settings.paths.resolved_models)

    raw_models = manager.scan_type(type) if type else manager.scan_all()
    models = [ModelInfo(**m) for m in raw_models]

    # Also include models from the active backend (e.g. demo backend)
    worker = request.app.state.worker
    if worker._backend:
        backend_models = worker._backend.list_available_models()
        existing_ids = {m.id for m in models}
        for bm in backend_models:
            if bm["id"] not in existing_ids:
                models.append(ModelInfo(**bm))

    # Determine active model from backend
    active_model = None
    if worker._backend and hasattr(worker._backend, "_current_model"):
        active_model = worker._backend._current_model or None

    return ModelListResponse(models=models, active_model=active_model)


@router.post("/models/{model_id}/load")
async def load_model(model_id: str, request: Request):
    """Explicitly load a model into VRAM."""
    worker = request.app.state.worker
    await worker._ensure_backend()
    if worker._backend:
        await worker._backend.load_model(model_id)
    return {"status": "loaded", "model_id": model_id}


@router.post("/models/unload")
async def unload_model(request: Request):
    """Unload the current model to free VRAM."""
    worker = request.app.state.worker
    if worker._backend:
        await worker._backend.unload_model()
    return {"status": "unloaded"}
