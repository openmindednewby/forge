"""Application configuration loaded from forge.yaml + environment variables."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


def _find_config_file() -> Path | None:
    """Walk up from CWD looking for forge.yaml."""
    current = Path.cwd()
    for parent in [current, *current.parents]:
        candidate = parent / "forge.yaml"
        if candidate.exists():
            return candidate
    return None


class ServerConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 7860


class PathsConfig(BaseModel):
    base_dir: Path | None = None
    models_dir: Path | None = None
    outputs_dir: Path | None = None
    db_path: Path | None = None

    @property
    def resolved_base(self) -> Path:
        return self.base_dir or Path.home() / ".forge"

    @property
    def resolved_models(self) -> Path:
        if self.models_dir and self.models_dir.is_absolute():
            return self.models_dir
        return self.resolved_base / (self.models_dir or "models")

    @property
    def resolved_outputs(self) -> Path:
        if self.outputs_dir and self.outputs_dir.is_absolute():
            return self.outputs_dir
        return self.resolved_base / (self.outputs_dir or "outputs")

    @property
    def resolved_db(self) -> Path:
        if self.db_path and self.db_path.is_absolute():
            return self.db_path
        return self.resolved_base / (self.db_path or "forge.db")


class GPUConfig(BaseModel):
    device: str = "cuda"
    half_precision: bool = True
    cpu_offload: bool = False
    attention_slicing: bool = False
    vae_tiling: bool = True


class GenerationConfig(BaseModel):
    default_steps: int = 30
    default_cfg_scale: float = 7.0
    default_width: int = 512
    default_height: int = 512
    default_sampler: str = "euler_a"
    max_width: int = 2048
    max_height: int = 2048
    max_batch_size: int = 4


class ComfyUIConfig(BaseModel):
    url: str = "http://localhost:8188"


class BackendConfig(BaseModel):
    active: str = "diffusers"
    comfyui: ComfyUIConfig = Field(default_factory=ComfyUIConfig)


class Settings(BaseSettings):
    server: ServerConfig = Field(default_factory=ServerConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    gpu: GPUConfig = Field(default_factory=GPUConfig)
    generation: GenerationConfig = Field(default_factory=GenerationConfig)
    backend: BackendConfig = Field(default_factory=BackendConfig)

    model_config = {"env_prefix": "FORGE_", "env_nested_delimiter": "__"}


def load_settings() -> Settings:
    """Load settings from forge.yaml, falling back to defaults."""
    config_path = _find_config_file()
    if config_path is None:
        return Settings()

    raw: dict[str, Any] = {}
    with open(config_path) as f:
        raw = yaml.safe_load(f) or {}

    return Settings(**raw)
