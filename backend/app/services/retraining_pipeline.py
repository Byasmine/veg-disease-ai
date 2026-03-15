"""
Learning agent + retraining pipeline.

Reads cases from data/retraining_candidates/ (filled when reviewers use mark_for_retraining),
exports a versioned train-ready dataset (images in class folders + manifest with hashes),
and exposes stats for learning with weakness detection and retraining threshold.
"""

import csv
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import urlopen, Request

from PIL import Image
import io

from app.config import (
    MIN_RETRAINING_SAMPLES,
    WEAKNESS_LABEL_THRESHOLD,
    MIN_IMAGE_RESOLUTION,
)
from app.core.logger import logger
from app.services.feedback_store import RETRAINING_DIR

# Export root; each export creates a versioned subfolder dataset_YYYY_MM_DD[_HHmmss]
EXPORT_ROOT = Path(__file__).resolve().parent.parent.parent / "data" / "retraining_export"
MANIFEST_NAME = "manifest.csv"


def _label_to_folder(label: str) -> str:
    """Normalize label for use as folder name (safe for filesystem)."""
    return re.sub(r"[^\w\-]+", "_", label.strip()).strip("_") or "unknown"


def _versioned_export_dir() -> Path:
    """Create a new versioned export directory: dataset_YYYY_MM_DD."""
    now = datetime.now(timezone.utc)
    name = f"dataset_{now.strftime('%Y_%m_%d')}"
    path = EXPORT_ROOT / name
    if path.exists():
        name = f"dataset_{now.strftime('%Y_%m_%d_%H%M%S')}"
        path = EXPORT_ROOT / name
    return path


def list_retraining_candidates() -> list[dict[str, Any]]:
    """Return all cases in data/retraining_candidates/ (for review and export)."""
    candidates = []
    if not RETRAINING_DIR.exists():
        return candidates
    for path in sorted(RETRAINING_DIR.glob("*.json")):
        try:
            with open(path) as f:
                data = json.load(f)
            candidates.append(data)
        except (json.JSONDecodeError, OSError):
            continue
    candidates.sort(key=lambda c: c.get("reviewed_at") or c.get("timestamp", ""), reverse=True)
    return candidates


def get_retraining_stats() -> dict[str, Any]:
    """
    Aggregate stats from retraining candidates for the learning agent:
    - total count, with_image count, by_label counts
    - weakness_detected: labels with high correction counts (confusion pattern)
    - retraining_recommended: True when total_candidates >= MIN_RETRAINING_SAMPLES
    """
    candidates = list_retraining_candidates()
    by_label: dict[str, int] = {}
    with_image = 0
    for c in candidates:
        label = c.get("corrected_label") or c.get("correct_label") or "unknown"
        by_label[label] = by_label.get(label, 0) + 1
        if c.get("image_url"):
            with_image += 1

    weakness_labels: list[str] = []
    for label, count in by_label.items():
        if count >= WEAKNESS_LABEL_THRESHOLD:
            weakness_labels.append(label)
            logger.info(
                "High number of corrections detected for %s: %d (consider retraining).",
                label,
                count,
            )

    total = len(candidates)
    retraining_recommended = total >= MIN_RETRAINING_SAMPLES
    if retraining_recommended:
        logger.info(
            "Retraining recommended: %d candidates (>= MIN_RETRAINING_SAMPLES=%d).",
            total,
            MIN_RETRAINING_SAMPLES,
        )

    return {
        "total_candidates": total,
        "with_image_url": with_image,
        "by_label": by_label,
        "weakness_labels": weakness_labels,
        "weakness_threshold": WEAKNESS_LABEL_THRESHOLD,
        "retraining_recommended": retraining_recommended,
        "min_retraining_samples": MIN_RETRAINING_SAMPLES,
    }


def _image_hash(content: bytes) -> str:
    """SHA256 hash of image bytes for deduplication."""
    return hashlib.sha256(content).hexdigest()


def _check_image_quality(content: bytes) -> tuple[bool, str]:
    """
    Check image is usable for training: sufficient resolution, not corrupted.
    Returns (ok, reason).
    """
    try:
        img = Image.open(io.BytesIO(content)).convert("RGB")
        w, h = img.size
        if w < MIN_IMAGE_RESOLUTION or h < MIN_IMAGE_RESOLUTION:
            return False, f"resolution {w}x{h} below minimum {MIN_IMAGE_RESOLUTION}"
        return True, ""
    except Exception as e:
        return False, f"corrupted or invalid: {e}"


def export_for_training(
    output_dir: Path | None = None,
    *,
    download_images: bool = True,
) -> dict[str, Any]:
    """
    Export retraining candidates to a versioned train-ready structure:
    - output_dir/train/<label>/<case_id>.jpg (or .png) for each candidate with image_url
    - output_dir/manifest.csv with case_id, path, label, image_hash, predicted_label, confidence
    - Skips duplicates (same image_hash), low-resolution, and corrupted images.

    If output_dir is not provided, creates a new versioned folder: dataset_YYYY_MM_DD.
    Returns summary: exported_count, skipped_no_url, skipped_duplicate, skipped_low_quality, output_path, manifest_path.
    """
    if output_dir is None:
        output_dir = _versioned_export_dir()
    output_dir.mkdir(parents=True, exist_ok=True)
    train_dir = output_dir / "train"
    train_dir.mkdir(parents=True, exist_ok=True)

    candidates = list_retraining_candidates()
    exported = 0
    skipped_no_url = 0
    skipped_duplicate = 0
    skipped_low_quality = 0
    seen_hashes: set[str] = set()
    manifest_rows: list[dict[str, Any]] = []

    for c in candidates:
        case_id = c.get("case_id", "unknown")
        image_url = c.get("image_url")
        label = c.get("corrected_label") or c.get("correct_label") or "unknown"
        folder_name = _label_to_folder(label)
        label_dir = train_dir / folder_name
        label_dir.mkdir(parents=True, exist_ok=True)

        if not image_url:
            skipped_no_url += 1
            continue

        if not download_images:
            manifest_rows.append({
                "case_id": case_id,
                "label": label,
                "predicted_label": c.get("predicted_label"),
                "confidence": c.get("confidence"),
                "image_url": image_url,
                "image_hash": "",
                "path": "",
                "rel_path": "",
            })
            exported += 1
            continue

        try:
            req = Request(image_url, headers={"User-Agent": "VegDiseaseAI-Retraining/1.0"})
            with urlopen(req, timeout=30) as resp:
                content = resp.read()
                content_type = (resp.headers.get_content_type() or "").lower()
            ext = "png" if "png" in content_type else "jpg"

            image_hash = _image_hash(content)
            if image_hash in seen_hashes:
                skipped_duplicate += 1
                continue
            seen_hashes.add(image_hash)

            ok, reason = _check_image_quality(content)
            if not ok:
                logger.debug("Retraining export: skip %s (%s)", case_id, reason)
                skipped_low_quality += 1
                continue

            out_path = label_dir / f"{case_id}.{ext}"
            out_path.write_bytes(content)
            rel_path = f"train/{folder_name}/{case_id}.{ext}"
            manifest_rows.append({
                "case_id": case_id,
                "label": label,
                "predicted_label": c.get("predicted_label"),
                "confidence": c.get("confidence"),
                "image_url": image_url,
                "image_hash": image_hash,
                "path": str(out_path),
                "rel_path": rel_path,
            })
            exported += 1
        except Exception as e:
            logger.warning("Retraining export: failed to download %s: %s", case_id, e)

    manifest_path = output_dir / MANIFEST_NAME
    fieldnames = ["case_id", "label", "predicted_label", "confidence", "image_url", "image_hash", "path", "rel_path"]
    if manifest_rows:
        with open(manifest_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(manifest_rows)

    return {
        "exported_count": exported,
        "skipped_no_url": skipped_no_url,
        "skipped_duplicate": skipped_duplicate,
        "skipped_low_quality": skipped_low_quality,
        "output_dir": str(output_dir),
        "train_dir": str(train_dir),
        "manifest_path": str(manifest_path),
        "dataset_version": output_dir.name,
    }
