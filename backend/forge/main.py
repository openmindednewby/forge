"""FastAPI application factory and startup/shutdown lifecycle."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from forge.config import Settings, load_settings
from forge.core.events import EventBus
from forge.core.queue import JobQueue
from forge.core.worker import GPUWorker
from forge.db.engine import create_engine_and_session, run_migrations

logger = logging.getLogger("forge")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup and shutdown lifecycle."""
    settings: Settings = app.state.settings

    # Ensure directories exist
    settings.paths.resolved_base.mkdir(parents=True, exist_ok=True)
    settings.paths.resolved_models.mkdir(parents=True, exist_ok=True)
    settings.paths.resolved_outputs.mkdir(parents=True, exist_ok=True)
    for subdir in ["checkpoints", "loras", "vaes", "controlnet", "upscalers"]:
        (settings.paths.resolved_models / subdir).mkdir(exist_ok=True)

    # Database
    engine, session_factory = create_engine_and_session(settings.paths.resolved_db)
    await run_migrations(engine)
    app.state.db_engine = engine
    app.state.session_factory = session_factory

    # Core services
    event_bus = EventBus()
    job_queue = JobQueue()
    worker = GPUWorker(
        queue=job_queue,
        event_bus=event_bus,
        settings=settings,
        session_factory=session_factory,
    )

    app.state.event_bus = event_bus
    app.state.job_queue = job_queue
    app.state.worker = worker

    # Start worker
    worker.start()
    logger.info("Forge started on %s:%s", settings.server.host, settings.server.port)

    yield

    # Shutdown
    await worker.stop()
    await engine.dispose()
    logger.info("Forge shut down")


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create and configure the FastAPI application."""
    if settings is None:
        settings = load_settings()

    app = FastAPI(
        title="Forge",
        description="Local Image Generation Platform",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.state.settings = settings

    # CORS for dev
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:7860"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API routes
    from forge.api.gallery import router as gallery_router
    from forge.api.generation import router as generation_router
    from forge.api.models import router as models_router
    from forge.api.settings import router as settings_router
    from forge.api.system import router as system_router
    from forge.api.ws import router as ws_router

    app.include_router(generation_router, prefix="/api")
    app.include_router(models_router, prefix="/api")
    app.include_router(gallery_router, prefix="/api")
    app.include_router(settings_router, prefix="/api")
    app.include_router(system_router, prefix="/api")
    app.include_router(ws_router)

    # Serve frontend static files in production
    dist_dir = Path(__file__).parent.parent.parent / "frontend" / "dist"
    if dist_dir.exists():
        app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")

    return app


# Default app instance for uvicorn
app = create_app()
