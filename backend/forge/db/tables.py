"""SQLAlchemy table definitions."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)
    mode: Mapped[str] = mapped_column(String(20), default="txt2img")
    prompt: Mapped[str] = mapped_column(Text, default="")
    negative_prompt: Mapped[str] = mapped_column(Text, default="")
    model_id: Mapped[str] = mapped_column(String(255), default="")
    width: Mapped[int] = mapped_column(Integer, default=512)
    height: Mapped[int] = mapped_column(Integer, default=512)
    steps: Mapped[int] = mapped_column(Integer, default=30)
    cfg_scale: Mapped[float] = mapped_column(Float, default=7.0)
    seed: Mapped[int] = mapped_column(Integer, default=-1)
    sampler: Mapped[str] = mapped_column(String(50), default="euler_a")
    params_json: Mapped[str] = mapped_column(Text, default="{}")
    error_message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class GeneratedImage(Base):
    __tablename__ = "generated_images"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=_new_id)
    job_id: Mapped[str] = mapped_column(String(12), index=True)
    file_path: Mapped[str] = mapped_column(String(500))
    thumbnail_path: Mapped[str] = mapped_column(String(500), default="")
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    seed: Mapped[int] = mapped_column(Integer, default=-1)
    prompt: Mapped[str] = mapped_column(Text, default="")
    negative_prompt: Mapped[str] = mapped_column(Text, default="")
    model_id: Mapped[str] = mapped_column(String(255), default="")
    params_json: Mapped[str] = mapped_column(Text, default="{}")
    is_favorite: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow
    )
