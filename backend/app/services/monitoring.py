"""Lightweight in-memory monitoring for product KPIs."""

from collections import deque
from typing import Any

MAX_EVENTS = 5000
_events: deque[dict[str, Any]] = deque(maxlen=MAX_EVENTS)


def record_prediction_event(
    *,
    status: str,
    inference_time_ms: float,
    llm_verdict: str | None,
) -> None:
    _events.append(
        {
            "status": status,
            "inference_time_ms": float(inference_time_ms),
            "llm_verdict": (llm_verdict or "").strip().lower(),
        }
    )


def summary() -> dict[str, Any]:
    events = list(_events)
    total = len(events)
    if total == 0:
        return {
            "window_size": 0,
            "status_counts": {"Success": 0, "Uncertain": 0, "Failure": 0},
            "uncertain_rate": 0.0,
            "llm_disagree_rate": 0.0,
            "latency_ms": {"avg": 0.0, "p95": 0.0, "max": 0.0},
        }

    status_counts = {"Success": 0, "Uncertain": 0, "Failure": 0}
    latencies = []
    llm_disagree = 0
    for e in events:
        status = str(e.get("status", ""))
        if status in status_counts:
            status_counts[status] += 1
        latencies.append(float(e.get("inference_time_ms", 0.0)))
        if str(e.get("llm_verdict", "")) == "disagree":
            llm_disagree += 1

    latencies.sort()
    p95_idx = max(0, int(0.95 * (len(latencies) - 1)))
    p95 = latencies[p95_idx]
    avg = sum(latencies) / len(latencies)

    return {
        "window_size": total,
        "status_counts": status_counts,
        "uncertain_rate": round(status_counts["Uncertain"] / total, 4),
        "llm_disagree_rate": round(llm_disagree / total, 4),
        "latency_ms": {
            "avg": round(avg, 2),
            "p95": round(p95, 2),
            "max": round(latencies[-1], 2),
        },
    }
