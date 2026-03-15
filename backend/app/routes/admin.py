"""Admin / maintenance endpoints (index knowledge, retraining pipeline, clear-all)."""

from fastapi import APIRouter, HTTPException

from app.config import PINECONE_ENABLED
from app.services.cloudinary_store import delete_folder_contents
from app.services.feedback_store import clear_all_feedback_and_retraining
from app.services.retraining_pipeline import (
    export_for_training,
    get_retraining_stats,
    list_retraining_candidates,
)
from app.services.vector_store import index_knowledge

router = APIRouter(prefix="/admin", tags=["Admin"])
FEEDBACK_CLOUDINARY_FOLDER = "veg-disease/feedback"


@router.post("/index-knowledge", summary="Index knowledge into Pinecone")
def post_index_knowledge() -> dict:
    """
    Build chunks from diagnostics.json and knowledge/*.md, embed and upsert to Pinecone.
    Call once after configuring Pinecone, or when you update knowledge content.
    Requires PINECONE_API_KEY and OPENAI_API_KEY.
    """
    if not PINECONE_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Pinecone is not configured. Set PINECONE_API_KEY (and create an index in Pinecone dashboard).",
        )
    result = index_knowledge()
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    return {"status": "ok", "indexed": result["indexed"]}


# --- Learning agent + retraining pipeline ---


@router.get("/retraining-candidates", summary="List retraining candidates")
def get_retraining_candidates() -> dict:
    """
    List all cases marked for retraining (from POST /review-case with action mark_for_retraining).
    Use these to prepare or run the retraining pipeline.
    """
    candidates = list_retraining_candidates()
    return {
        "total": len(candidates),
        "candidates": [
            {
                "case_id": c.get("case_id"),
                "correct_label": c.get("correct_label"),
                "corrected_label": c.get("corrected_label"),
                "predicted_label": c.get("predicted_label"),
                "confidence": c.get("confidence"),
                "image_url": "yes" if c.get("image_url") else "no",
                "reviewed_at": c.get("reviewed_at"),
            }
            for c in candidates
        ],
    }


@router.get("/retraining-stats", summary="Retraining stats for learning agent")
def get_stats() -> dict:
    """
    Aggregate stats: total candidates, count with image_url, count per label.
    Use for prioritization and to decide when to run retraining.
    """
    return get_retraining_stats()


@router.post("/clear-all", summary="Clear all feedback, retraining data, and Cloudinary feedback images")
def post_clear_all() -> dict:
    """
    Delete all feedback cases, retraining candidates, and images in Cloudinary folder veg-disease/feedback.
    Use for 'Clear everything' in the app (local history is cleared on device separately).
    """
    counts = clear_all_feedback_and_retraining()
    cloudinary_result = delete_folder_contents(FEEDBACK_CLOUDINARY_FOLDER)
    return {
        "status": "ok",
        "feedback_deleted": counts["feedback_deleted"],
        "retraining_deleted": counts["retraining_deleted"],
        "cloudinary_deleted": cloudinary_result is not None,
    }


@router.post("/export-retraining-dataset", summary="Export versioned dataset for training")
def post_export_retraining_dataset() -> dict:
    """
    Export retraining candidates to a versioned train-ready structure:
    - data/retraining_export/dataset_YYYY_MM_DD/train/<label>/<case_id>.jpg
    - data/retraining_export/dataset_YYYY_MM_DD/manifest.csv (includes image_hash)

    Skips: no image_url, duplicate image hash, low resolution or corrupted images.
    After export, use the versioned folder with your training pipeline.
    """
    result = export_for_training(download_images=True)
    return {
        "status": "ok",
        "dataset_version": result["dataset_version"],
        "exported_count": result["exported_count"],
        "skipped_no_url": result["skipped_no_url"],
        "skipped_duplicate": result["skipped_duplicate"],
        "skipped_low_quality": result["skipped_low_quality"],
        "output_dir": result["output_dir"],
        "manifest_path": result["manifest_path"],
    }
