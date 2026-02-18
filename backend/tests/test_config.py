"""Tests for configuration loading."""

from pathlib import Path

from forge.config import Settings


def test_default_settings():
    """Default settings should have sensible values."""
    s = Settings()
    assert s.server.port == 7860
    assert s.gpu.device == "cuda"
    assert s.gpu.half_precision is True
    assert s.generation.default_steps == 30
    assert s.backend.active == "diffusers"


def test_resolved_paths():
    """Paths should resolve relative to base_dir."""
    s = Settings(paths={"base_dir": "/tmp/forge-test"})
    assert s.paths.resolved_base == Path("/tmp/forge-test")
    assert s.paths.resolved_models == Path("/tmp/forge-test/models")
    assert s.paths.resolved_outputs == Path("/tmp/forge-test/outputs")
    assert s.paths.resolved_db == Path("/tmp/forge-test/forge.db")


def test_custom_settings():
    """Custom values should override defaults."""
    s = Settings(
        server={"host": "127.0.0.1", "port": 9000},
        gpu={"device": "cpu", "half_precision": False},
        generation={"default_steps": 20, "default_width": 768},
    )
    assert s.server.port == 9000
    assert s.gpu.device == "cpu"
    assert s.generation.default_steps == 20
    assert s.generation.default_width == 768
