"""Abstract base class for all generation backends."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any

from forge.config import Settings
from forge.schemas.generation import GenerateRequest, GenerationMode


class BaseBackend(ABC):
    """Interface that every backend must implement."""

    name: str = "base"

    @abstractmethod
    async def initialize(self, settings: Settings) -> None:
        """Initialize the backend (load libraries, check GPU, etc.)."""

    @abstractmethod
    async def shutdown(self) -> None:
        """Clean up resources."""

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        """Return health status."""

    @abstractmethod
    async def generate(
        self, params: GenerateRequest, job_id: str
    ) -> AsyncIterator[dict[str, Any]]:
        """Generate images. Yield progress updates, then a final result dict.

        Yields:
            {"type": "progress", "step": int, "total_steps": int, "percentage": float}
            {"type": "result", "images": [{"file_path": str, ...}]}
        """
        yield {}  # type: ignore[misc]

    @abstractmethod
    async def load_model(self, model_id: str) -> None:
        """Load a specific model."""

    @abstractmethod
    async def unload_model(self) -> None:
        """Unload the current model to free VRAM."""

    @abstractmethod
    def list_available_models(self) -> list[dict[str, Any]]:
        """List model files found on disk."""

    def get_supported_modes(self) -> list[GenerationMode]:
        """Which generation modes this backend supports."""
        return [GenerationMode.TXT2IMG]

    async def get_system_info(self) -> dict[str, Any]:
        """Return GPU/system information."""
        return {}
