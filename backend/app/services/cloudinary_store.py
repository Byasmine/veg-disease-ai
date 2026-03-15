"""Cloudinary cloud storage for images (feedback, predictions, audit)."""

import io
from typing import Any

from app.config import (
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_ENABLED,
    CLOUDINARY_FOLDER,
)
from app.core.logger import logger


def upload_image(
    file_content: bytes,
    *,
    folder: str | None = None,
    public_id_prefix: str | None = None,
    tags: list[str] | None = None,
) -> dict[str, Any] | None:
    """
    Upload image bytes to Cloudinary. Returns dict with secure_url, public_id, etc., or None if disabled/failed.
    """
    if not CLOUDINARY_ENABLED:
        logger.debug("Cloudinary upload skipped: not configured")
        return None

    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
        )
        upload_folder = folder or CLOUDINARY_FOLDER
        options: dict[str, Any] = {
            "folder": upload_folder,
            "resource_type": "image",
        }
        if public_id_prefix:
            options["public_id"] = public_id_prefix  # Cloudinary appends unique id if needed
        if tags:
            options["tags"] = tags

        result = cloudinary.uploader.upload(
            io.BytesIO(file_content),
            **options,
        )
        return {
            "secure_url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "url": result.get("secure_url"),
        }
    except Exception as e:
        logger.exception("Cloudinary upload failed: %s", e)
        return None


def delete_folder_contents(folder_prefix: str) -> dict[str, Any] | None:
    """
    Delete all resources under a folder prefix (e.g. 'veg-disease/feedback/').
    Returns result dict with deleted counts or None if disabled/failed.
    """
    if not CLOUDINARY_ENABLED:
        logger.debug("Cloudinary delete skipped: not configured")
        return None
    prefix = folder_prefix.rstrip("/") + "/"
    try:
        import cloudinary
        import cloudinary.api
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
        )
        result = cloudinary.api.delete_resources_by_prefix(prefix, resource_type="image")
        logger.info("Cloudinary deleted resources by prefix: %s", prefix)
        return result
    except Exception as e:
        logger.exception("Cloudinary delete by prefix failed: %s", e)
        return None
