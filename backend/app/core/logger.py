"""Structured logging for the diagnostic API and feedback loop."""

import logging
import sys
from datetime import datetime, timezone

# Single module logger; can be extended with handlers per environment
logger = logging.getLogger("veg_disease_api")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s | %(name)s | %(levelname)s | %(message)s")
    )
    logger.addHandler(handler)


def log_prediction(prediction: str, confidence: float, status: str, inference_time_ms: float) -> None:
    """Log inference result (including uncertain predictions for feedback loop)."""
    logger.info(
        "prediction | %s | confidence=%.4f | status=%s | inference_time_ms=%.2f",
        prediction,
        confidence,
        status,
        inference_time_ms,
    )


def log_feedback(case_id: str, predicted_label: str, correct_label: str, confidence: float) -> None:
    """Log user feedback submission."""
    logger.info(
        "feedback_received | case_id=%s | predicted=%s | correct=%s | confidence=%.4f",
        case_id,
        predicted_label,
        correct_label,
        confidence,
    )


def log_review_decision(case_id: str, action: str, corrected_label: str | None = None) -> None:
    """Log human review decision (approve, correct_label, mark_for_retraining, reject)."""
    msg = "review_decision | case_id=%s | action=%s", case_id, action
    if corrected_label is not None:
        logger.info(msg[0] + " | corrected_label=%s", *(msg[1:] + (corrected_label,)))
    else:
        logger.info(*msg)
