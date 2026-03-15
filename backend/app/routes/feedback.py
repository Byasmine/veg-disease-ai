"""Human-in-the-loop: feedback submission and review queue."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core.logger import log_feedback, log_review_decision
from app.services.cloudinary_store import upload_image as cloudinary_upload
from app.services.feedback_store import (
    list_pending_review,
    review_case,
    save_feedback,
)

router = APIRouter(tags=["Feedback & Review"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


# --- Request/Response models ---


class FeedbackPayload(BaseModel):
    """Payload for POST /feedback (JSON body)."""

    image_id: str | None = Field(None, description="Optional reference to the image")
    predicted_label: str = Field(..., description="Label returned by the model")
    correct_label: str = Field(..., description="User-provided correct label")
    user_comment: str | None = Field(None, description="Optional comment")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")


class ReviewCasePayload(BaseModel):
    """Payload for POST /review-case."""

    case_id: str = Field(..., description="ID of the case to review")
    action: str = Field(
        ...,
        description="One of: approve_prediction, correct_label, mark_for_retraining, reject_case",
    )
    corrected_label: str | None = Field(
        None,
        description="Required when action is correct_label or mark_for_retraining (if label change)",
    )


# --- Endpoints ---


@router.post("/feedback", summary="Submit feedback (JSON)")
def submit_feedback(payload: FeedbackPayload) -> dict:
    """
    Submit user feedback for an incorrect or uncertain prediction (JSON body).
    For feedback with image upload to Cloudinary, use POST /feedback/with-image.
    """
    record = save_feedback(
        predicted_label=payload.predicted_label,
        correct_label=payload.correct_label,
        confidence=payload.confidence,
        user_comment=payload.user_comment or "",
        image_id=payload.image_id,
        image_url=None,
    )
    log_feedback(
        record["case_id"],
        payload.predicted_label,
        payload.correct_label,
        payload.confidence,
    )
    return {
        "status": "received",
        "case_id": record["case_id"],
        "message": "Feedback stored for review",
    }


@router.post("/feedback/with-image", summary="Submit feedback with image (Cloudinary)")
async def submit_feedback_with_image(
    predicted_label: str = Form(...),
    correct_label: str = Form(...),
    confidence: float = Form(..., ge=0, le=1),
    user_comment: str | None = Form(None),
    image_id: str | None = Form(None),
    image: UploadFile = File(...),
) -> dict:
    """
    Submit feedback with an image. Image is uploaded to Cloudinary when configured;
    image_url is stored in the case for review.
    """
    if image.content_type and image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Image type not allowed. Use: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )
    content = await image.read()
    if not content:
        raise HTTPException(status_code=422, detail="Empty image file.")

    image_url: str | None = None
    image_uploaded = False
    up = cloudinary_upload(content, folder="veg-disease/feedback", tags=["feedback"])
    if up and up.get("secure_url"):
        image_url = up["secure_url"]
        image_uploaded = True

    record = save_feedback(
        predicted_label=predicted_label,
        correct_label=correct_label,
        confidence=confidence,
        user_comment=user_comment or "",
        image_id=image_id,
        image_url=image_url,
    )
    log_feedback(record["case_id"], predicted_label, correct_label, confidence)
    return {
        "status": "received",
        "case_id": record["case_id"],
        "message": "Feedback stored for review",
        "image_url": image_url,
        "image_uploaded": image_uploaded,
    }


@router.get("/review-queue", summary="Get review queue (pending cases)")
def get_review_queue() -> dict:
    """
    Return all cases with status pending_review for human review.
    """
    cases = list_pending_review()
    return {
        "total": len(cases),
        "cases": [
            {
                "case_id": c["case_id"],
                "timestamp": c["timestamp"],
                "image_id": c.get("image_id"),
                "image_url": c.get("image_url"),
                "predicted_label": c["predicted_label"],
                "correct_label": c["correct_label"],
                "confidence": c["confidence"],
                "comment": c.get("comment", ""),
            }
            for c in cases
        ],
    }


@router.post("/review-case", summary="Apply review decision to a case")
def post_review_case(payload: ReviewCasePayload) -> dict:
    """
    Apply a review decision: approve_prediction, correct_label, mark_for_retraining, reject_case.
    For correct_label / mark_for_retraining you may set corrected_label.
    """
    allowed = ("approve_prediction", "correct_label", "mark_for_retraining", "reject_case")
    if payload.action not in allowed:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "invalid_action",
                "message": f"action must be one of: {', '.join(allowed)}",
            },
        )

    updated = review_case(
        case_id=payload.case_id,
        action=payload.action,
        corrected_label=payload.corrected_label,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Case not found")

    log_review_decision(
        payload.case_id,
        payload.action,
        payload.corrected_label,
    )
    return {
        "status": "updated",
        "case_id": payload.case_id,
        "action": payload.action,
        "case_status": updated["status"],
    }
