"""Decision orchestrator: fuse model inference, rules, and optional LLM reasoning."""

from typing import Any

from PIL import Image

from app.config import (
    FUSION_WEIGHT_LLM,
    FUSION_WEIGHT_MODEL,
    FUSION_WEIGHT_RULE,
    REASONING_ENABLED,
    UNCERTAINTY_ENTROPY_THRESHOLD,
    UNCERTAINTY_MARGIN_THRESHOLD,
    WORKFLOW_ACCEPT_MIN_SCORE,
    WORKFLOW_REJECT_MAX_MODEL_CONFIDENCE,
    WORKFLOW_REVIEW_MIN_SCORE,
)
from app.core.logger import log_decision
from app.services.inference import predict
from app.services.monitoring import record_prediction_event
from app.services.reasoning_agent import reason
from app.services.validation import validate_image

# Weighted fusion for a production-friendly decision score.
# You can tune these without changing route logic.
W_MODEL = FUSION_WEIGHT_MODEL
W_RULE = FUSION_WEIGHT_RULE
W_LLM = FUSION_WEIGHT_LLM


def _rule_score(agent_decision: dict[str, Any] | None) -> float:
    if not isinstance(agent_decision, dict):
        return 0.0
    if agent_decision.get("review_needed") is False:
        return 1.0
    next_action = str(agent_decision.get("next_action", "")).lower()
    if "better image" in next_action:
        return 0.45
    return 0.15


def _llm_score(llm_reasoning: dict[str, Any] | None) -> float:
    if not isinstance(llm_reasoning, dict):
        return 0.5
    verdict = str(llm_reasoning.get("verdict", "uncertain")).lower().strip()
    if verdict == "agree":
        return 1.0
    if verdict == "disagree":
        return 0.0
    return 0.5


def _fused_status(score: float) -> str:
    if score >= 0.80:
        return "Success"
    if score >= 0.45:
        return "Uncertain"
    return "Failure"


def _workflow_decision(
    *,
    fused_score: float,
    model_confidence: float,
    margin: float,
    entropy: float,
    llm_verdict: str | None,
) -> str:
    """Operational decision state for product workflows."""
    if model_confidence <= WORKFLOW_REJECT_MAX_MODEL_CONFIDENCE:
        return "REJECTED"
    if llm_verdict == "disagree":
        return "REVIEW"
    if margin < UNCERTAINTY_MARGIN_THRESHOLD or entropy > UNCERTAINTY_ENTROPY_THRESHOLD:
        return "REVIEW"
    if fused_score >= WORKFLOW_ACCEPT_MIN_SCORE:
        return "ACCEPTED"
    if fused_score >= WORKFLOW_REVIEW_MIN_SCORE:
        return "REVIEW"
    return "REJECTED"


def run_prediction(image: Image.Image, *, with_reasoning: bool = False) -> dict[str, Any]:
    """
    End-to-end prediction orchestration:
    1) validate image
    2) run model inference
    3) optionally add LLM reasoning
    4) compute fused decision score and final status
    """
    image = validate_image(image)
    base = predict(image)

    llm_reasoning = None
    if with_reasoning and REASONING_ENABLED:
        llm_reasoning = reason(base)

    model_score = float(base.get("confidence", 0.0))
    uncertainty = base.get("uncertainty", {})
    margin = float(uncertainty.get("top2_margin", 0.0)) if isinstance(uncertainty, dict) else 0.0
    entropy = float(uncertainty.get("entropy_norm", 1.0)) if isinstance(uncertainty, dict) else 1.0
    rule_score = _rule_score(base.get("agent_decision"))
    llm_score = _llm_score(llm_reasoning)
    fused_score = round((W_MODEL * model_score) + (W_RULE * rule_score) + (W_LLM * llm_score), 4)
    fused_status = _fused_status(fused_score)
    llm_verdict = None
    if isinstance(llm_reasoning, dict):
        llm_verdict = str(llm_reasoning.get("verdict", "")).strip().lower()
    workflow_decision = _workflow_decision(
        fused_score=fused_score,
        model_confidence=model_score,
        margin=margin,
        entropy=entropy,
        llm_verdict=llm_verdict,
    )

    base["llm_reasoning"] = llm_reasoning
    base["decision"] = {
        "engine": "fusion_v1",
        "weights": {"model": W_MODEL, "rule": W_RULE, "llm": W_LLM},
        "scores": {
            "model_confidence": round(model_score, 4),
            "rule_score": round(rule_score, 4),
            "llm_score": round(llm_score, 4),
            "fused_score": fused_score,
            "top2_margin": round(margin, 6),
            "entropy_norm": round(entropy, 6),
        },
        "final_status": fused_status,
        "workflow_decision": workflow_decision,
    }
    # Keep legacy top-level status aligned with fused decision for clients.
    base["status"] = fused_status

    log_decision(
        prediction=str(base.get("prediction", "")),
        model_confidence=model_score,
        fused_score=fused_score,
        final_status=fused_status,
    )
    record_prediction_event(
        status=fused_status,
        inference_time_ms=float(base.get("inference_time_ms", 0.0)),
        llm_verdict=llm_verdict,
    )
    return base
