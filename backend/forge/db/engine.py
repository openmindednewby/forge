"""SQLAlchemy async engine and session factory."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from forge.db.tables import Base


def create_engine_and_session(
    db_path: Path,
) -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    """Create async engine and session factory for SQLite."""
    url = f"sqlite+aiosqlite:///{db_path}"
    engine = create_async_engine(url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return engine, session_factory


async def run_migrations(engine: AsyncEngine) -> None:
    """Create all tables (simple migration for v0.1)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
