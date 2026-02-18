"""Model-related schemas."""

from __future__ import annotations

from pydantic import BaseModel


class ModelInfo(BaseModel):
    """Information about a model file."""

    id: str  # relative path as identifier
    name: str
    filename: str
    type: str  # checkpoint, lora, vae, controlnet, upscaler
    size_bytes: int
    hash: str = ""
    metadata: dict = {}


class ModelListResponse(BaseModel):
    """List of available models."""

    models: list[ModelInfo]
    active_model: str | None = None
