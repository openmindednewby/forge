"""Gallery API — browse generated images."""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse
from sqlalchemy import func, select

from forge.db.tables import GeneratedImage
from forge.schemas.gallery import GalleryImageResponse, GalleryListResponse

router = APIRouter(tags=["gallery"])


@router.get("/gallery", response_model=GalleryListResponse)
async def list_gallery(
    request: Request,
    page: int = 1,
    page_size: int = 50,
    favorites_only: bool = False,
):
    """List generated images with pagination."""
    session_factory = request.app.state.session_factory

    async with session_factory() as session:
        base_query = select(GeneratedImage)
        count_query = select(func.count(GeneratedImage.id))

        if favorites_only:
            base_query = base_query.where(GeneratedImage.is_favorite.is_(True))
            count_query = count_query.where(GeneratedImage.is_favorite.is_(True))

        # Total count
        total_result = await session.execute(count_query)
        total = total_result.scalar() or 0

        # Paginated results
        offset = (page - 1) * page_size
        stmt = (
            base_query.order_by(GeneratedImage.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await session.execute(stmt)
        images = [
            GalleryImageResponse(
                id=img.id,
                job_id=img.job_id,
                file_path=img.file_path,
                thumbnail_path=img.thumbnail_path,
                width=img.width,
                height=img.height,
                seed=img.seed,
                prompt=img.prompt,
                negative_prompt=img.negative_prompt,
                model_id=img.model_id,
                is_favorite=img.is_favorite,
                created_at=img.created_at,
            )
            for img in result.scalars().all()
        ]

    return GalleryListResponse(
        images=images,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/gallery/{image_id}/image")
async def get_image(image_id: str, request: Request):
    """Serve the full-size image file."""
    session_factory = request.app.state.session_factory

    async with session_factory() as session:
        stmt = select(GeneratedImage).where(GeneratedImage.id == image_id)
        result = await session.execute(stmt)
        img = result.scalar_one_or_none()

    if not img:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(img.file_path, media_type="image/png")


@router.get("/gallery/{image_id}/thumbnail")
async def get_thumbnail(image_id: str, request: Request):
    """Serve the thumbnail image."""
    session_factory = request.app.state.session_factory

    async with session_factory() as session:
        stmt = select(GeneratedImage).where(GeneratedImage.id == image_id)
        result = await session.execute(stmt)
        img = result.scalar_one_or_none()

    if not img:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(img.thumbnail_path, media_type="image/jpeg")


@router.patch("/gallery/{image_id}/favorite")
async def toggle_favorite(image_id: str, request: Request):
    """Toggle favorite status for an image."""
    session_factory = request.app.state.session_factory

    async with session_factory() as session:
        stmt = select(GeneratedImage).where(GeneratedImage.id == image_id)
        result = await session.execute(stmt)
        img = result.scalar_one_or_none()

        if not img:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Image not found")

        img.is_favorite = not img.is_favorite
        await session.commit()

    return {"id": image_id, "is_favorite": img.is_favorite}
