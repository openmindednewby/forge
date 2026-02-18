"""Generation-related schemas."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class GenerationMode(StrEnum):
    TXT2IMG = "txt2img"
    IMG2IMG = "img2img"
    INPAINT = "inpaint"
    OUTPAINT = "outpaint"
    UPSCALE = "upscale"


class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class GenerateRequest(BaseModel):
    """Request to generate an image."""

    mode: GenerationMode = GenerationMode.TXT2IMG
    prompt: str = ""
    negative_prompt: str = ""
    model_id: str = ""
    width: int = Field(default=512, ge=64, le=2048, multiple_of=8)
    height: int = Field(default=512, ge=64, le=2048, multiple_of=8)
    steps: int = Field(default=30, ge=1, le=150)
    cfg_scale: float = Field(default=7.0, ge=1.0, le=30.0)
    seed: int = Field(default=-1)
    sampler: str = "euler_a"
    batch_size: int = Field(default=1, ge=1, le=4)


class ProgressUpdate(BaseModel):
    """Progress update sent during generation."""

    job_id: str
    step: int
    total_steps: int
    percentage: float
    preview_image: str | None = None  # base64 JPEG


class GenerationResult(BaseModel):
    """Final result of a generation job."""

    job_id: str
    images: list[GeneratedImageInfo]
    seed: int
    elapsed_seconds: float


class GeneratedImageInfo(BaseModel):
    """Info about a single generated image."""

    id: str
    file_path: str
    thumbnail_path: str
    width: int
    height: int
    seed: int


class JobResponse(BaseModel):
    """Response for a single job."""

    id: str
    status: JobStatus
    mode: GenerationMode
    prompt: str
    negative_prompt: str
    model_id: str
    width: int
    height: int
    steps: int
    cfg_scale: float
    seed: int
    sampler: str
    images: list[GeneratedImageInfo] = []
    error_message: str = ""
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    progress: ProgressUpdate | None = None
