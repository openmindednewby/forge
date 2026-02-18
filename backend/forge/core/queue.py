"""Async job queue for generation requests."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field


@dataclass
class QueuedJob:
    """A job waiting in the queue."""

    job_id: str
    priority: int = 0  # lower = higher priority
    params: dict = field(default_factory=dict)


class JobQueue:
    """asyncio.Queue-based job queue with cancellation support."""

    def __init__(self, maxsize: int = 100) -> None:
        self._queue: asyncio.Queue[QueuedJob] = asyncio.Queue(maxsize=maxsize)
        self._cancelled: set[str] = set()

    async def put(self, job: QueuedJob) -> None:
        """Add a job to the queue."""
        await self._queue.put(job)

    async def get(self) -> QueuedJob:
        """Get the next job, skipping cancelled ones."""
        while True:
            job = await self._queue.get()
            if job.job_id not in self._cancelled:
                return job
            self._cancelled.discard(job.job_id)

    def cancel(self, job_id: str) -> None:
        """Mark a job for cancellation."""
        self._cancelled.add(job_id)

    def is_cancelled(self, job_id: str) -> bool:
        return job_id in self._cancelled

    @property
    def size(self) -> int:
        return self._queue.qsize()
