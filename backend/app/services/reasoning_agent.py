"""Optional LLM reasoning agent: RAG over plant-disease knowledge + structured output."""

from typing import Any

from app.config import (
    GROQ_API_KEY,
    GROQ_BASE_URL,
    GROQ_MODEL,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL,
)
from app.core.logger import logger
from app.services.knowledge import retrieve_for_prediction


SYSTEM_PROMPT = """You are an expert agronomist assistant. You receive:
1) A vision model's disease prediction (label, confidence, top alternatives).
2) Retrieved plant-disease knowledge (summaries and treatments).

Your task:
- In 2–4 sentences, explain whether the model's prediction is plausible and why (reference symptoms and knowledge).
- Give one short, practical recommendation (e.g. "Proceed with treatment for X" or "Request a clearer image of the leaf" or "Suggest human review").
- State if you agree with the model, are uncertain, or disagree (e.g. if a top-k alternative fits better).

Reply in this exact format, one per line:
REASONING: <your short explanation>
RECOMMENDATION: <one sentence>
VERDICT: agree | uncertain | disagree
"""


def _build_user_prompt(prediction_result: dict[str, Any], rag_context: str) -> str:
    pred = prediction_result.get("prediction", "?")
    conf = prediction_result.get("confidence", 0)
    status = prediction_result.get("status", "?")
    top_k = prediction_result.get("top_k", [])
    report = prediction_result.get("diagnostic_report", {})
    agent = prediction_result.get("agent_decision", {})

    lines = [
        "## Model output",
        f"Prediction: {pred}",
        f"Confidence: {conf:.2%}",
        f"Status: {status}",
        f"Agent decision: review_needed={agent.get('review_needed')}, next_action={agent.get('next_action')}",
        "",
        "Top alternatives:",
    ]
    for i, item in enumerate(top_k[:5], 1):
        lines.append(f"  {i}. {item.get('label', '?')} ({item.get('confidence', 0):.2%})")
    lines.append("")
    lines.append(f"Diagnostic summary: {report.get('summary', '')}")
    lines.append(f"Recommended treatment: {report.get('recommended_treatment', '')}")
    lines.append("")
    lines.append("## Retrieved knowledge (RAG)")
    lines.append(rag_context)

    return "\n".join(lines)


def reason(prediction_result: dict[str, Any]) -> dict[str, Any] | None:
    """
    Run the LLM reasoning agent with RAG context.
    Returns {"reasoning", "recommendation", "verdict"} or None if disabled/failed.
    """
    if not OPENAI_API_KEY and not GROQ_API_KEY:
        logger.debug("Reasoning agent skipped: no OPENAI_API_KEY or GROQ_API_KEY set")
        return None

    try:
        rag_context = retrieve_for_prediction(prediction_result)
        user_prompt = _build_user_prompt(prediction_result, rag_context)

        # Prefer Groq if key is set, else OpenAI
        if GROQ_API_KEY:
            api_key = GROQ_API_KEY
            base_url = GROQ_BASE_URL
            model = GROQ_MODEL
        else:
            api_key = OPENAI_API_KEY
            base_url = OPENAI_BASE_URL
            model = OPENAI_MODEL

        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url=base_url if base_url else None)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=400,
            temperature=0.2,
        )
        content = (response.choices[0].message.content or "").strip()

        # Parse REASONING / RECOMMENDATION / VERDICT
        reasoning = ""
        recommendation = ""
        verdict = "uncertain"
        for line in content.split("\n"):
            line = line.strip()
            if line.upper().startswith("REASONING:"):
                reasoning = line.split(":", 1)[-1].strip()
            elif line.upper().startswith("RECOMMENDATION:"):
                recommendation = line.split(":", 1)[-1].strip()
            elif line.upper().startswith("VERDICT:"):
                v = line.split(":", 1)[-1].strip().lower()
                if v in ("agree", "uncertain", "disagree"):
                    verdict = v

        return {
            "reasoning": reasoning or content,
            "recommendation": recommendation,
            "verdict": verdict,
        }
    except Exception as e:
        logger.exception("Reasoning agent failed: %s", e)
        return {
            "reasoning": "",
            "recommendation": "Unable to generate LLM reasoning.",
            "verdict": "uncertain",
            "error": str(e),
        }
