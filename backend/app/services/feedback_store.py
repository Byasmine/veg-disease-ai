"""Storage layer for feedback cases and human review queue."""

import json
import uuid
from pathlib import Path
from datetime import datetime, timezone

# Data directories (project root relative to this file)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FEEDBACK_DIR = BASE_DIR / "data" / "feedback_cases"
RETRAINING_DIR = BASE_DIR / "data" / "retraining_candidates"

FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
RETRAINING_DIR.mkdir(parents=True, exist_ok=True)

STATUS_PENDING = "pending_review"
STATUS_APPROVED = "approved"
STATUS_CORRECTED = "corrected"
STATUS_REJECTED = "rejected"
STATUS_FOR_RETRAINING = "mark_for_retraining"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def generate_case_id() -> str:
    return f"case_{uuid.uuid4().hex[:12]}"


def save_feedback(
    predicted_label: str,
    correct_label: str,
    confidence: float,
    user_comment: str = "",
    image_id: str | None = None,
    image_url: str | None = None,
) -> dict:
    """Store a new feedback case and return the case record."""
    case_id = generate_case_id()
    record = {
        "case_id": case_id,
        "timestamp": _now_iso(),
        "image_id": image_id,
        "image_url": image_url,
        "predicted_label": predicted_label,
        "correct_label": correct_label,
        "confidence": round(confidence, 4),
        "status": STATUS_PENDING,
        "comment": user_comment or "",
    }
    path = FEEDBACK_DIR / f"{case_id}.json"
    with open(path, "w") as f:
        json.dump(record, f, indent=2)
    return record


def list_pending_review() -> list[dict]:
    """Return all cases with status pending_review."""
    cases = []
    for path in FEEDBACK_DIR.glob("*.json"):
        try:
            with open(path) as f:
                data = json.load(f)
            if data.get("status") == STATUS_PENDING:
                cases.append(data)
        except (json.JSONDecodeError, OSError):
            continue
    cases.sort(key=lambda c: c.get("timestamp", ""), reverse=True)
    return cases


def get_case(case_id: str) -> dict | None:
    """Load a single case by id."""
    path = FEEDBACK_DIR / f"{case_id}.json"
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def _write_case(case_id: str, data: dict) -> None:
    path = FEEDBACK_DIR / f"{case_id}.json"
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def review_case(
    case_id: str,
    action: str,
    corrected_label: str | None = None,
) -> dict | None:
    """
    Apply a review decision: approve_prediction, correct_label, mark_for_retraining, reject_case.
    Returns updated case or None if not found.
    """
    case = get_case(case_id)
    if not case:
        return None

    if action == "approve_prediction":
        case["status"] = STATUS_APPROVED
        case["reviewed_at"] = _now_iso()
    elif action == "correct_label":
        case["status"] = STATUS_CORRECTED
        case["reviewed_at"] = _now_iso()
        if corrected_label is not None:
            case["corrected_label"] = corrected_label
    elif action == "mark_for_retraining":
        case["status"] = STATUS_FOR_RETRAINING
        case["reviewed_at"] = _now_iso()
        if corrected_label is not None:
            case["corrected_label"] = corrected_label
        _write_case(case_id, case)
        _add_to_retraining_candidates(case)
        return case
    elif action == "reject_case":
        case["status"] = STATUS_REJECTED
        case["reviewed_at"] = _now_iso()
    else:
        return None

    _write_case(case_id, case)
    return case


def _add_to_retraining_candidates(case: dict) -> None:
    """Append case metadata to retraining candidates dataset."""
    case_id = case.get("case_id", "unknown")
    path = RETRAINING_DIR / f"{case_id}.json"
    payload = {
        "case_id": case_id,
        "timestamp": case.get("timestamp"),
        "reviewed_at": case.get("reviewed_at"),
        "predicted_label": case.get("predicted_label"),
        "correct_label": case.get("correct_label"),
        "corrected_label": case.get("corrected_label"),
        "confidence": case.get("confidence"),
        "comment": case.get("comment"),
        "image_id": case.get("image_id"),
        "image_url": case.get("image_url"),
    }
    with open(path, "w") as f:
        json.dump(payload, f, indent=2)


def clear_all_feedback_and_retraining() -> dict:
    """
    Delete all feedback case files and retraining candidate files.
    Returns counts: feedback_deleted, retraining_deleted.
    """
    feedback_deleted = 0
    retraining_deleted = 0
    for path in FEEDBACK_DIR.glob("*.json"):
        try:
            path.unlink()
            feedback_deleted += 1
        except OSError:
            pass
    for path in RETRAINING_DIR.glob("*.json"):
        try:
            path.unlink()
            retraining_deleted += 1
        except OSError:
            pass
    return {"feedback_deleted": feedback_deleted, "retraining_deleted": retraining_deleted}
