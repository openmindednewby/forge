"""Image storage — save, thumbnail, PNG metadata embedding."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from PIL import Image, PngImagePlugin

logger = logging.getLogger("forge.storage")

THUMBNAIL_SIZE = 256


async def save_generation_images(
    images: list,
    job_id: str,
    seed: int,
    outputs_dir: Path,
) -> list[dict[str, Any]]:
    """Save PIL images to disk with thumbnails and metadata.

    Returns list of image info dicts for DB storage.
    """
    date_str = datetime.now(UTC).strftime("%Y-%m-%d")
    output_dir = outputs_dir / date_str
    output_dir.mkdir(parents=True, exist_ok=True)

    thumb_dir = output_dir / "thumbnails"
    thumb_dir.mkdir(exist_ok=True)

    results = []
    for i, img in enumerate(images):
        img_id = uuid.uuid4().hex[:12]
        filename = f"forge_{img_id}.png"
        thumb_filename = f"forge_{img_id}_thumb.jpg"

        # Save full image
        file_path = output_dir / filename
        img.save(str(file_path), "PNG")

        # Save thumbnail
        thumb_path = thumb_dir / thumb_filename
        thumb = img.copy()
        thumb.thumbnail((THUMBNAIL_SIZE, THUMBNAIL_SIZE), Image.Resampling.LANCZOS)
        thumb.save(str(thumb_path), "JPEG", quality=85)

        results.append(
            {
                "id": img_id,
                "file_path": str(file_path),
                "thumbnail_path": str(thumb_path),
                "width": img.width,
                "height": img.height,
                "seed": seed + i,
            }
        )

    return results


def embed_png_metadata(file_path: Path, metadata: dict[str, str]) -> None:
    """Embed metadata into PNG tEXt chunks (A1111-compatible)."""
    img = Image.open(file_path)
    png_info = PngImagePlugin.PngInfo()
    for key, value in metadata.items():
        png_info.add_text(key, value)
    img.save(str(file_path), "PNG", pnginfo=png_info)
