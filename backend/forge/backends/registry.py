"""Backend auto-discovery and registration."""

from __future__ import annotations

import logging
from typing import Any

from forge.backends.base import BaseBackend

logger = logging.getLogger("forge.backends")

_BACKEND_CLASSES: dict[str, type[BaseBackend]] = {}


def register_backend(name: str):
    """Decorator to register a backend class."""

    def decorator(cls: type[BaseBackend]):
        _BACKEND_CLASSES[name] = cls
        return cls

    return decorator


class BackendRegistry:
    """Discovers and manages backend instances."""

    def __init__(self) -> None:
        self._instances: dict[str, BaseBackend] = {}
        self._discover()

    def _discover(self) -> None:
        """Try importing each backend module. Missing deps = silently skip."""
        backends = [
            ("diffusers", "forge.backends.diffusers_backend.backend"),
            ("comfyui", "forge.backends.comfyui_backend.backend"),
            ("onnx", "forge.backends.onnx_backend.backend"),
            ("demo", "forge.backends.demo_backend.backend"),
        ]
        for name, module_path in backends:
            try:
                __import__(module_path)
                logger.info("Backend '%s' registered", name)
            except ImportError as e:
                logger.debug("Backend '%s' not available: %s", name, e)
            except Exception as e:
                logger.warning("Backend '%s' failed to load: %s", name, e)

    def get(self, name: str) -> BaseBackend | None:
        """Get or create a backend instance by name."""
        if name in self._instances:
            return self._instances[name]

        cls = _BACKEND_CLASSES.get(name)
        if cls is None:
            return None

        instance = cls()
        self._instances[name] = instance
        return instance

    def list_available(self) -> list[str]:
        """Return names of all registered backends."""
        return list(_BACKEND_CLASSES.keys())

    def get_all_info(self) -> dict[str, Any]:
        """Return info about all registered backends."""
        return {
            name: {"available": True, "instance_active": name in self._instances}
            for name in _BACKEND_CLASSES
        }
