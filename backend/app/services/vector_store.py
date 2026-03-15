"""Pinecone vector store for RAG: embed and query plant-disease knowledge."""

import json
from pathlib import Path
from typing import Any

from app.config import (
    EMBEDDING_MODEL,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    PINECONE_ENABLED,
    PINECONE_INDEX_NAME,
    PINECONE_NAMESPACE,
    PINECONE_API_KEY,
    PINECONE_HOST,
)
from app.core.logger import logger

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"
DIAGNOSTICS_PATH = ARTIFACTS_DIR / "diagnostics.json"
KNOWLEDGE_DIR = ARTIFACTS_DIR / "knowledge"


def _embed(texts: list[str]) -> list[list[float]]:
    """OpenAI embeddings (text-embedding-3-small by default)."""
    if not OPENAI_API_KEY:
        return []
    from openai import OpenAI
    client_kw: dict[str, Any] = {"api_key": OPENAI_API_KEY}
    if OPENAI_BASE_URL:
        client_kw["base_url"] = OPENAI_BASE_URL
    client = OpenAI(**client_kw)
    resp = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [e.embedding for e in resp.data]


def _get_index():
    """Lazy Pinecone index connection."""
    if not PINECONE_ENABLED:
        return None
    try:
        from pinecone import Pinecone
        pc = Pinecone(api_key=PINECONE_API_KEY)
        if PINECONE_HOST:
            return pc.Index(host=PINECONE_HOST)
        return pc.Index(PINECONE_INDEX_NAME)
    except Exception as e:
        logger.warning("Pinecone index unavailable: %s", e)
        return None


def query(
    query_text: str,
    *,
    top_k: int = 5,
    namespace: str | None = None,
) -> list[dict[str, Any]]:
    """
    Embed query_text, search Pinecone, return list of matches with metadata.
    Each item: {"text": ..., "score": ..., "metadata": {...}}
    """
    index = _get_index()
    if index is None:
        return []
    vectors = _embed([query_text])
    if not vectors:
        return []
    ns = namespace or PINECONE_NAMESPACE
    try:
        result = index.query(
            vector=vectors[0],
            top_k=top_k,
            namespace=ns,
            include_metadata=True,
        )
        out = []
        for m in (result.matches or []):
            meta = (m.metadata or {}).copy()
            text = meta.pop("text", "") or getattr(m, "id", "")
            out.append({
                "text": text,
                "score": getattr(m, "score", 0.0) or 0.0,
                "metadata": meta,
            })
        return out
    except Exception as e:
        logger.exception("Pinecone query failed: %s", e)
        return []


def upsert_vectors(
    ids: list[str],
    texts: list[str],
    metadatas: list[dict[str, Any]] | None = None,
    namespace: str | None = None,
) -> bool:
    """Embed texts and upsert into Pinecone. Returns True on success."""
    if not ids or not texts or len(ids) != len(texts):
        return False
    index = _get_index()
    if index is None:
        return False
    vectors = _embed(texts)
    if len(vectors) != len(ids):
        return False
    metadatas = metadatas or [{}] * len(ids)
    if len(metadatas) != len(ids):
        metadatas = [{}] * len(ids)
    # Pinecone metadata values must be str | int | float | bool
    records = []
    for i, (vid, vec, meta) in enumerate(zip(ids, vectors, metadatas)):
        m = {k: v for k, v in meta.items() if v is not None and isinstance(v, (str, int, float, bool))}
        m["text"] = texts[i][:40_000]  # limit size
        records.append({"id": vid, "values": vec, "metadata": m})
    ns = namespace or PINECONE_NAMESPACE
    try:
        index.upsert(vectors=records, namespace=ns)
        return True
    except Exception as e:
        logger.exception("Pinecone upsert failed: %s", e)
        return False


def index_knowledge(namespace: str | None = None) -> dict[str, Any]:
    """
    Build chunks from diagnostics.json and knowledge/*.md, embed and upsert to Pinecone.
    Call once after setting up Pinecone or when knowledge content changes.
    Returns {"indexed": N, "error": ... }.
    """
    if not PINECONE_ENABLED or not OPENAI_API_KEY:
        return {"indexed": 0, "error": "Pinecone or OpenAI not configured"}

    ids: list[str] = []
    texts: list[str] = []
    metadatas: list[dict[str, Any]] = []

    # Chunks from diagnostics
    if DIAGNOSTICS_PATH.exists():
        with open(DIAGNOSTICS_PATH) as f:
            diag = json.load(f)
        for label, entry in diag.items():
            summary = entry.get("summary", "")
            treatment = entry.get("treatment", "")
            text = f"{label}\nSummary: {summary}\nTreatment: {treatment}"
            ids.append(f"diag_{label.replace(' ', '_')}")
            texts.append(text)
            metadatas.append({"source": "diagnostics", "label": label})

    # Chunks from knowledge/*.md (by section or paragraph)
    if KNOWLEDGE_DIR.exists():
        for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
            try:
                content = path.read_text(encoding="utf-8")
                # Simple chunking: split by ## or \n\n, keep meaningful chunks
                parts = [p.strip() for p in content.split("\n\n") if len(p.strip()) > 30]
                for i, part in enumerate(parts):
                    chunk_id = f"kb_{path.stem}_{i}"
                    ids.append(chunk_id)
                    texts.append(part)
                    metadatas.append({"source": "knowledge", "file": path.name})
            except (OSError, UnicodeDecodeError) as e:
                logger.warning("Skip %s: %s", path, e)

    if not ids:
        return {"indexed": 0, "error": "No knowledge chunks to index"}

    ok = upsert_vectors(ids, texts, metadatas, namespace=namespace)
    return {"indexed": len(ids) if ok else 0, "error": None if ok else "Upsert failed"}
