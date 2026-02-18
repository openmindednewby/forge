"""Generation API — submit jobs, query status."""

from __future__ import annotations

import json

from fastapi import APIRouter, Request
from sqlalchemy import select

from forge.core.queue import QueuedJob
from forge.db.tables import GeneratedImage, Job
from forge.schemas.generation import GenerateRequest, JobResponse, JobStatus

router = APIRouter(tags=["generation"])


@router.post("/generate", response_model=JobResponse)
async def create_generation(req: GenerateRequest, request: Request):
    """Submit a new generation job."""
    session_factory = request.app.state.session_factory
    job_queue = request.app.state.job_queue

    # Create job in DB
    async with session_factory() as session:
        job = Job(
            mode=req.mode,
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            model_id=req.model_id,
            width=req.width,
            height=req.height,
            steps=req.steps,
            cfg_scale=req.cfg_scale,
            seed=req.seed,
            sampler=req.sampler,
            params_json=json.dumps(req.model_dump()),
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)
        job_id = job.id

    # Enqueue
    await job_queue.put(
        QueuedJob(job_id=job_id, params=req.model_dump())
    )

    return JobResponse(
        id=job_id,
        status=JobStatus.QUEUED,
        mode=req.mode,
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        model_id=req.model_id,
        width=req.width,
        height=req.height,
        steps=req.steps,
        cfg_scale=req.cfg_scale,
        seed=req.seed,
        sampler=req.sampler,
        created_at=job.created_at,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, request: Request):
    """Get the status and result of a job."""
    session_factory = request.app.state.session_factory

    async with session_factory() as session:
        stmt = select(Job).where(Job.id == job_id)
        result = await session.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Job not found")

        # Get images if completed
        images = []
        if job.status == "completed":
            img_stmt = select(GeneratedImage).where(GeneratedImage.job_id == job_id)
            img_result = await session.execute(img_stmt)
            for img in img_result.scalars().all():
                images.append(
                    {
                        "id": img.id,
                        "file_path": img.file_path,
                        "thumbnail_path": img.thumbnail_path,
                        "width": img.width,
                        "height": img.height,
                        "seed": img.seed,
                    }
                )

        return JobResponse(
            id=job.id,
            status=JobStatus(job.status),
            mode=job.mode,
            prompt=job.prompt,
            negative_prompt=job.negative_prompt,
            model_id=job.model_id,
            width=job.width,
            height=job.height,
            steps=job.steps,
            cfg_scale=job.cfg_scale,
            seed=job.seed,
            sampler=job.sampler,
            images=images,
            error_message=job.error_message,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str, request: Request):
    """Cancel a queued or running job."""
    job_queue = request.app.state.job_queue
    job_queue.cancel(job_id)
    return {"status": "cancelled", "job_id": job_id}
