"""GPU worker — single consumer, serial execution to prevent OOM."""

from __future__ import annotations

import asyncio
import contextlib
import logging
import time
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from forge.config import Settings
from forge.core.events import EventBus
from forge.core.queue import JobQueue

logger = logging.getLogger("forge.worker")


class GPUWorker:
    """Pulls jobs from the queue and executes them serially on the GPU."""

    def __init__(
        self,
        queue: JobQueue,
        event_bus: EventBus,
        settings: Settings,
        session_factory: async_sessionmaker[AsyncSession],
    ) -> None:
        self._queue = queue
        self._event_bus = event_bus
        self._settings = settings
        self._session_factory = session_factory
        self._task: asyncio.Task | None = None
        self._running = False
        self._backend = None

    def start(self) -> None:
        """Start the worker loop."""
        self._running = True
        self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        """Stop the worker gracefully."""
        self._running = False
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
        if self._backend:
            await self._backend.shutdown()

    async def _ensure_backend(self):
        """Lazy-initialize the active backend, falling back to demo."""
        if self._backend is not None:
            return

        from forge.backends.registry import BackendRegistry

        registry = BackendRegistry()
        active = self._settings.backend.active
        self._backend = registry.get(active)

        if self._backend:
            await self._backend.initialize(self._settings)
            logger.info("Backend '%s' initialized", active)
            return

        # Fall back to demo backend if the configured one isn't available
        if active != "demo":
            available = registry.list_available()
            logger.warning(
                "Backend '%s' not available (installed: %s), falling back to demo",
                active,
                available,
            )
            self._backend = registry.get("demo")
            if self._backend:
                await self._backend.initialize(self._settings)
                logger.info("Demo backend initialized as fallback")
                return

        logger.error("No backends available at all")

    async def _run(self) -> None:
        """Main worker loop."""
        logger.info("GPU worker started")
        while self._running:
            try:
                job = await asyncio.wait_for(self._queue.get(), timeout=1.0)
            except TimeoutError:
                continue
            except asyncio.CancelledError:
                break

            await self._process_job(job)

    async def _process_job(self, queued_job) -> None:
        """Process a single generation job."""
        from forge.db.tables import GeneratedImage, Job
        from forge.schemas.generation import GenerateRequest

        job_id = queued_job.job_id
        logger.info("Processing job %s", job_id)
        start_time = time.monotonic()

        # Update status to running
        async with self._session_factory() as session:
            from sqlalchemy import select

            stmt = select(Job).where(Job.id == job_id)
            result = await session.execute(stmt)
            job = result.scalar_one_or_none()
            if not job:
                logger.error("Job %s not found in DB", job_id)
                return

            job.status = "running"
            job.started_at = datetime.now(UTC)
            await session.commit()

        await self._event_bus.publish({"type": "job:started", "job_id": job_id})

        try:
            await self._ensure_backend()
            if not self._backend:
                raise RuntimeError("No backend available")

            params = GenerateRequest(**queued_job.params)
            image_paths: list[dict] = []

            async for update in self._backend.generate(params, job_id):
                if self._queue.is_cancelled(job_id):
                    logger.info("Job %s cancelled", job_id)
                    break

                if update.get("type") == "progress":
                    await self._event_bus.publish(
                        {
                            "type": "job:progress",
                            "job_id": job_id,
                            "step": update["step"],
                            "total_steps": update["total_steps"],
                            "percentage": update["percentage"],
                            "preview_image": update.get("preview_image"),
                        }
                    )
                elif update.get("type") == "result":
                    image_paths = update["images"]

            elapsed = time.monotonic() - start_time

            # Save images to DB
            async with self._session_factory() as session:
                stmt = select(Job).where(Job.id == job_id)
                result = await session.execute(stmt)
                job = result.scalar_one_or_none()
                if job:
                    if self._queue.is_cancelled(job_id):
                        job.status = "cancelled"
                    else:
                        job.status = "completed"
                    job.completed_at = datetime.now(UTC)

                    for img_info in image_paths:
                        img = GeneratedImage(
                            id=img_info["id"],
                            job_id=job_id,
                            file_path=img_info["file_path"],
                            thumbnail_path=img_info.get("thumbnail_path", ""),
                            width=img_info["width"],
                            height=img_info["height"],
                            seed=img_info.get("seed", -1),
                            prompt=job.prompt,
                            negative_prompt=job.negative_prompt,
                            model_id=job.model_id,
                            params_json=job.params_json,
                        )
                        session.add(img)

                    await session.commit()

            await self._event_bus.publish(
                {
                    "type": "job:completed",
                    "job_id": job_id,
                    "images": image_paths,
                    "elapsed_seconds": round(elapsed, 2),
                }
            )
            logger.info("Job %s completed in %.2fs", job_id, elapsed)

        except Exception as exc:
            logger.exception("Job %s failed: %s", job_id, exc)
            async with self._session_factory() as session:
                from sqlalchemy import select

                stmt = select(Job).where(Job.id == job_id)
                result = await session.execute(stmt)
                job = result.scalar_one_or_none()
                if job:
                    job.status = "failed"
                    job.error_message = str(exc)
                    job.completed_at = datetime.now(UTC)
                    await session.commit()

            await self._event_bus.publish(
                {
                    "type": "job:failed",
                    "job_id": job_id,
                    "error": str(exc),
                }
            )
