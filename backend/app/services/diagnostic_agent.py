"""Diagnostic agent: decides whether to trust the prediction or request human review."""

from typing import Any

from app.config import CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_LOW


def evaluate(
    predicted_label: str,
    confidence: float,
    top_k: list[dict[str, Any]],
    diagnostic_report: dict[str, str],
) -> dict[str, Any]:
    """
    Analyze model output and produce a decision for the diagnostic workflow.

    Returns a structured decision with review_needed, reason, and next_action.
    """
    if confidence >= CONFIDENCE_THRESHOLD_HIGH:
        return {
            "review_needed": False,
            "reason": "",
            "next_action": "Provide treatment guidance",
        }
    if confidence >= CONFIDENCE_THRESHOLD_LOW:
        return {
            "review_needed": True,
            "reason": "Prediction uncertain",
            "next_action": "Request better image or additional context",
        }
    return {
        "review_needed": True,
        "reason": "Prediction unreliable",
        "next_action": "Escalate case to human review",
    }
