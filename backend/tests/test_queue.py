"""Tests for the job queue."""

import asyncio

import pytest

from forge.core.queue import JobQueue, QueuedJob


@pytest.mark.asyncio
async def test_put_and_get():
    q = JobQueue()
    job = QueuedJob(job_id="test1")
    await q.put(job)
    assert q.size == 1
    result = await q.get()
    assert result.job_id == "test1"
    assert q.size == 0


@pytest.mark.asyncio
async def test_cancel_skips_job():
    q = JobQueue()
    await q.put(QueuedJob(job_id="cancel_me"))
    await q.put(QueuedJob(job_id="keep_me"))
    q.cancel("cancel_me")

    result = await q.get()
    assert result.job_id == "keep_me"


@pytest.mark.asyncio
async def test_is_cancelled():
    q = JobQueue()
    q.cancel("abc")
    assert q.is_cancelled("abc") is True
    assert q.is_cancelled("xyz") is False
