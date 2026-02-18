"""Gallery-related schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class GalleryImageResponse(BaseModel):
    """Single image in gallery."""

    id: str
    job_id: str
    file_path: str
    thumbnail_path: str
    width: int
    height: int
    seed: int
    prompt: str
    negative_prompt: str
    model_id: str
    is_favorite: bool
    created_at: datetime


class GalleryListResponse(BaseModel):
    """Paginated gallery response."""

    images: list[GalleryImageResponse]
    total: int
    page: int
    page_size: int
