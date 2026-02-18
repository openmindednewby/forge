"""ONNX Runtime backend — placeholder for v1.0."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from forge.backends.base import BaseBackend
from forge.config import Settings
from forge.schemas.generation import GenerateRequest

# Not registered — for v1.0
# @register_backend("onnx")


class ONNXBackend(BaseBackend):
    """ONNX Runtime with CUDA/DirectML/CPU providers."""

    name = "onnx"

    async def initialize(self, settings: Settings) -> None:
        pass

    async def shutdown(self) -> None:
        pass

    async def health_check(self) -> dict[str, Any]:
        return {"status": "not_implemented"}

    async def generate(
        self, params: GenerateRequest, job_id: str
    ) -> AsyncIterator[dict[str, Any]]:
        raise NotImplementedError("ONNX backend coming in v1.0")
        yield  # noqa: F401

    async def load_model(self, model_id: str) -> None:
        pass

    async def unload_model(self) -> None:
        pass

    def list_available_models(self) -> list[dict[str, Any]]:
        return []
