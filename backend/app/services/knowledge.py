"""RAG: retrieve plant-disease knowledge for the reasoning agent (Pinecone or fallback)."""

import json
from pathlib import Path
from typing import Any

from app.config import PINECONE_ENABLED
from app.services import vector_store

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"
DIAGNOSTICS_PATH = ARTIFACTS_DIR / "diagnostics.json"
KNOWLEDGE_DIR = ARTIFACTS_DIR / "knowledge"

# Load diagnostics once (used for fallback and for building query context)
with open(DIAGNOSTICS_PATH) as f:
    _diagnostics = json.load(f)


def _load_general_knowledge(max_chars: int = 2000) -> str:
    """Load general guidance from knowledge/*.md (simple RAG source)."""
    text_parts = []
    if not KNOWLEDGE_DIR.exists():
        return ""
    for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
        try:
            content = path.read_text(encoding="utf-8")
            if len(content) > max_chars:
                content = content[:max_chars] + "\n[... truncated]"
            text_parts.append(f"--- {path.name} ---\n{content}")
        except (OSError, UnicodeDecodeError):
            continue
    return "\n\n".join(text_parts)


def _retrieve_from_pinecone(prediction_result: dict[str, Any], top_k: int = 6) -> str:
    """Query Pinecone with a text built from prediction; return formatted context."""
    pred = prediction_result.get("prediction", "")
    conf = prediction_result.get("confidence", 0)
    top_k_labels = [item.get("label", "") for item in prediction_result.get("top_k", [])[:5]]
    query_parts = [
        f"tomato plant disease {pred}",
        "symptoms treatment",
        " ".join(top_k_labels),
    ]
    query_text = " ".join(query_parts)
    matches = vector_store.query(query_text, top_k=top_k)
    if not matches:
        return ""
    sections = ["## Retrieved knowledge (Pinecone RAG)\n"]
    for m in matches:
        text = m.get("text", "").strip()
        if text:
            sections.append(text)
    return "\n\n".join(sections)


def retrieve_for_prediction(prediction_result: dict[str, Any]) -> str:
    """
    Build RAG context: use Pinecone when configured, else diagnostics + knowledge files.
    Returns a single string to inject into the LLM prompt.
    """
    if PINECONE_ENABLED:
        pinecone_ctx = _retrieve_from_pinecone(prediction_result)
        if pinecone_ctx:
            # Optionally merge with diagnostics for predicted label so we always have that
            pred_label = prediction_result.get("prediction", "")
            entry = _diagnostics.get(pred_label, {})
            if entry:
                extra = f"\n\n## Primary diagnosis ({pred_label})\nSummary: {entry.get('summary', '')}\nTreatment: {entry.get('treatment', '')}"
                return pinecone_ctx + extra
            return pinecone_ctx

    # Fallback: diagnostics + general knowledge (no Pinecone)
    sections = []
    pred_label = prediction_result.get("prediction", "")
    top_k = prediction_result.get("top_k", [])[:5]
    labels_to_fetch = [pred_label]
    for item in top_k:
        lb = item.get("label")
        if lb and lb not in labels_to_fetch:
            labels_to_fetch.append(lb)

    for label in labels_to_fetch:
        entry = _diagnostics.get(label, {})
        if not entry:
            continue
        summary = entry.get("summary", "")
        treatment = entry.get("treatment", "")
        sections.append(f"[{label}]\nSummary: {summary}\nTreatment: {treatment}")

    if sections:
        sections.insert(0, "## Disease knowledge (from database)\n" + "\n\n".join(sections))
    general = _load_general_knowledge()
    if general:
        sections.append("## General guidance\n" + general)

    return "\n\n".join(sections) if sections else "No additional knowledge retrieved."
