import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

from app.config import (
    CONFIDENCE_THRESHOLD_HIGH,
    CONFIDENCE_THRESHOLD_LOW,
    MODEL_VERSION,
    TOP_K_DEFAULT,
)
from app.core.logger import log_prediction, logger
from app.services.diagnostic_agent import evaluate as agent_evaluate

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model_v1.onnx"
LABEL_PATH = ARTIFACTS_DIR / "labels.json"
DIAGNOSTICS_PATH = ARTIFACTS_DIR / "diagnostics.json"

# Load model
session = ort.InferenceSession(str(MODEL_PATH))

# Load labels
with open(LABEL_PATH) as f:
    labels = json.load(f)

# Load diagnostics (summary + treatment per class)
with open(DIAGNOSTICS_PATH) as f:
    diagnostics = json.load(f)

input_name = session.get_inputs()[0].name


def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Match notebook val_transforms: Resize(224,224) + ToTensor() only.
    No ImageNet mean/std — model was trained on [0, 1] pixel values.
    """
    image = image.resize((224, 224))
    image = np.array(image, dtype=np.float32) / 255.0
    image = np.transpose(image, (2, 0, 1))
    image = np.expand_dims(image, axis=0).astype(np.float32)
    return image

def softmax(x: np.ndarray) -> np.ndarray:
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()


def _status(confidence: float) -> str:
    if confidence >= CONFIDENCE_THRESHOLD_HIGH:
        return "Success"
    if confidence >= CONFIDENCE_THRESHOLD_LOW:
        return "Uncertain"
    return "Failure"


def predict(image: Image.Image, top_k: int = TOP_K_DEFAULT) -> dict:
    image_arr = preprocess_image(image)

    t0 = time.perf_counter()
    outputs = session.run(None, {input_name: image_arr})
    inference_time_ms = (time.perf_counter() - t0) * 1000

    logits = outputs[0][0]
    probs = softmax(logits)

    k = min(top_k, len(labels))
    top_indices = probs.argsort()[-k:][::-1]

    top_k_list = []
    for idx in top_indices:
        conf = float(probs[idx])
        top_k_list.append(
            {
                "label": labels[idx],
                "confidence": round(conf, 4),
            }
        )

    best = top_k_list[0]
    label = best["label"]
    confidence = best["confidence"]
    status = _status(float(confidence))

    report = diagnostics.get(label, {})
    diagnostic_report = {
        "summary": report.get("summary", ""),
        "recommended_treatment": report.get("treatment", ""),
    }

    agent_decision = agent_evaluate(
        predicted_label=label,
        confidence=float(confidence),
        top_k=top_k_list,
        diagnostic_report=diagnostic_report,
    )

    log_prediction(label, float(confidence), status, inference_time_ms)
    if status == "Uncertain":
        logger.info("uncertain_prediction | %s | confidence=%.4f", label, confidence)

    return {
        "status": status,
        "prediction": label,
        "confidence": confidence,
        "top_k": top_k_list,
        "diagnostic_report": diagnostic_report,
        "agent_decision": agent_decision,
        "model_version": MODEL_VERSION,
        "inference_time_ms": round(inference_time_ms, 2),
    }