import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

from app.config import (
    CONFIDENCE_THRESHOLD_HIGH,
    CONFIDENCE_THRESHOLD_LOW,
    MODEL_FILENAME,
    MODEL_VERSION,
    TOP_K_DEFAULT,
)
from app.core.logger import log_prediction, logger
from app.services.diagnostic_agent import evaluate as agent_evaluate

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model_v1.onnx"
LABEL_PATH = ARTIFACTS_DIR / "labels.json"
DIAGNOSTICS_PATH = ARTIFACTS_DIR / "diagnostics.json"
MODEL_METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"

# Disease -> shop recommendation hints (MVP mocked data).
# The mobile app can use `shop_query` to fetch concrete products from the shop API.
RECOMMENDED_PRODUCTS_MAP = {
    "Bacterial_spot": [
        {
            "name": "Copper Bactericide Spray",
            "reason": "Commonly used to limit bacterial spread on tomato leaves.",
            "shop_query": "copper bactericide",
        },
        {
            "name": "Pruning Shears (Sanitized Use)",
            "reason": "Remove infected parts to reduce disease pressure.",
            "shop_query": "pruning shears",
        },
        {
            "name": "Disinfectant for Tools",
            "reason": "Helps prevent pathogen transfer between plants.",
            "shop_query": "garden disinfectant",
        },
    ],
    "Early_blight": [
        {
            "name": "Chlorothalonil Fungicide",
            "reason": "Helps control early blight fungal infection.",
            "shop_query": "chlorothalonil fungicide",
        },
        {
            "name": "Tomato Mulch Sheet",
            "reason": "Reduces soil splash and fungal spread to leaves.",
            "shop_query": "garden mulch",
        },
        {
            "name": "Leaf Spray Bottle",
            "reason": "Useful for precise fungicide application.",
            "shop_query": "sprayer bottle",
        },
    ],
    "Late_blight": [
        {
            "name": "Copper Fungicide",
            "reason": "Often recommended for late blight management.",
            "shop_query": "copper fungicide",
        },
        {
            "name": "Protective Crop Cover",
            "reason": "Can help limit wetness and disease spread conditions.",
            "shop_query": "crop cover",
        },
        {
            "name": "Backpack Sprayer",
            "reason": "Improves coverage during treatment.",
            "shop_query": "backpack sprayer",
        },
    ],
    "Leaf_Mold": [
        {
            "name": "Leaf Mold Fungicide",
            "reason": "Targeted treatment support for mold symptoms.",
            "shop_query": "leaf mold fungicide",
        },
        {
            "name": "Greenhouse Ventilation Fan",
            "reason": "Lower humidity to reduce leaf mold pressure.",
            "shop_query": "ventilation fan",
        },
        {
            "name": "Humidity Meter",
            "reason": "Track humidity to keep conditions safer for crops.",
            "shop_query": "humidity meter",
        },
    ],
    "Septoria_leaf_spot": [
        {
            "name": "Protective Fungicide Spray",
            "reason": "Common protection strategy for septoria control.",
            "shop_query": "fungicide spray",
        },
        {
            "name": "Mulch Material",
            "reason": "Helps reduce rain splash transmission.",
            "shop_query": "mulch",
        },
        {
            "name": "Garden Pruner",
            "reason": "Remove heavily infected leaves quickly.",
            "shop_query": "garden pruner",
        },
    ],
    "Spider_mites Two-spotted_spider_mite": [
        {
            "name": "Miticide",
            "reason": "Direct control option for severe mite infestations.",
            "shop_query": "miticide",
        },
        {
            "name": "Neem Oil",
            "reason": "Widely used for integrated pest management.",
            "shop_query": "neem oil",
        },
        {
            "name": "Fine Mist Sprayer",
            "reason": "Supports routine leaf treatments.",
            "shop_query": "mist sprayer",
        },
    ],
    "Target_Spot": [
        {
            "name": "Broad-spectrum Fungicide",
            "reason": "Can help reduce target spot progression.",
            "shop_query": "broad spectrum fungicide",
        },
        {
            "name": "Plant Support Stakes",
            "reason": "Improve airflow by keeping foliage off wet soil.",
            "shop_query": "plant stake",
        },
        {
            "name": "Sanitary Pruning Kit",
            "reason": "Helps remove infected tissue safely.",
            "shop_query": "pruning kit",
        },
    ],
    "Tomato_Yellow_Leaf_Curl_Virus": [
        {
            "name": "Whitefly Trap",
            "reason": "Helps reduce whitefly vectors carrying the virus.",
            "shop_query": "whitefly trap",
        },
        {
            "name": "Insect-proof Net",
            "reason": "Physical barrier against vector insects.",
            "shop_query": "insect net",
        },
        {
            "name": "Bio Insecticide",
            "reason": "Supports integrated vector management.",
            "shop_query": "bio insecticide",
        },
    ],
    "Tomato_mosaic_virus": [
        {
            "name": "Tool Disinfectant",
            "reason": "Critical to reduce contact transmission.",
            "shop_query": "tool disinfectant",
        },
        {
            "name": "Disposable Gloves",
            "reason": "Limits plant-to-plant contamination during handling.",
            "shop_query": "disposable gloves",
        },
        {
            "name": "Sanitation Kit",
            "reason": "Supports strict hygiene routines.",
            "shop_query": "sanitation kit",
        },
    ],
    "powdery_mildew": [
        {
            "name": "Sulfur Fungicide",
            "reason": "Common control option for powdery mildew.",
            "shop_query": "sulfur fungicide",
        },
        {
            "name": "Foliar Sprayer",
            "reason": "Even application improves treatment effectiveness.",
            "shop_query": "foliar sprayer",
        },
        {
            "name": "Airflow Clip Fan",
            "reason": "Better airflow reduces mildew-favorable conditions.",
            "shop_query": "clip fan",
        },
    ],
    "healthy": [
        {
            "name": "Balanced NPK Fertilizer",
            "reason": "Maintain healthy growth and resilience.",
            "shop_query": "npk fertilizer",
        },
        {
            "name": "Organic Compost",
            "reason": "Supports soil health and plant vigor.",
            "shop_query": "organic compost",
        },
        {
            "name": "Preventive Bio Spray",
            "reason": "Helps routine preventive care.",
            "shop_query": "bio spray",
        },
    ],
}

# Resolve model path from config with safe fallback.
configured_model_path = ARTIFACTS_DIR / MODEL_FILENAME
if configured_model_path.exists():
    MODEL_PATH = configured_model_path

# Load model
session = ort.InferenceSession(str(MODEL_PATH))

# Load labels
with open(LABEL_PATH) as f:
    labels = json.load(f)

# Load diagnostics (summary + treatment per class)
with open(DIAGNOSTICS_PATH) as f:
    diagnostics = json.load(f)

model_metadata = {
    "model_version": MODEL_VERSION,
    "model_file": MODEL_PATH.name,
}
if MODEL_METADATA_PATH.exists():
    try:
        with open(MODEL_METADATA_PATH) as f:
            loaded_meta = json.load(f)
        if isinstance(loaded_meta, dict):
            model_metadata.update(loaded_meta)
    except (json.JSONDecodeError, OSError):
        logger.warning("Could not parse model_metadata.json, using defaults.")

input_name = session.get_inputs()[0].name


def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Match notebook val_transforms: Resize(224,224) + ToTensor() only.
    No ImageNet mean/std — model was trained on [0, 1] pixel values.
    """
    image = image.resize((224, 224))
    image = np.array(image, dtype=np.float32) / 255.0 #normalisation des valeurs de l'image entre 0 et 1
    image = np.transpose(image, (2, 0, 1)) #transpose l'image de (height, width, channels) à (channels, height, width)
    image = np.expand_dims(image, axis=0).astype(np.float32) #ajoute une dimension à l'image pour la batch size
    return image

def softmax(x: np.ndarray) -> np.ndarray:
    shifted = x - np.max(x)
    e_x = np.exp(shifted)
    return e_x / e_x.sum()


def _normalized_entropy(probs: np.ndarray) -> float:
    """Entropy normalized to [0, 1] for uncertainty scoring."""
    eps = 1e-12
    clipped = np.clip(probs, eps, 1.0)
    entropy = float(-np.sum(clipped * np.log(clipped)))
    max_entropy = float(np.log(len(probs))) if len(probs) > 1 else 1.0
    return entropy / max_entropy if max_entropy > 0 else 0.0


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
        top_k_list.append({"label": labels[idx], "confidence": round(conf, 6)})

    best = top_k_list[0]
    label = best["label"]
    confidence = float(best["confidence"])
    status = _status(float(confidence))
    top2_conf = float(top_k_list[1]["confidence"]) if len(top_k_list) > 1 else 0.0
    confidence_margin = round(max(0.0, confidence - top2_conf), 6)
    uncertainty_entropy = round(_normalized_entropy(probs), 6)

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
        "recommended_products": RECOMMENDED_PRODUCTS_MAP.get(label, []),
        "agent_decision": agent_decision,
        "model_version": model_metadata.get("model_version", MODEL_VERSION),
        "model_file": model_metadata.get("model_file", MODEL_PATH.name),
        "inference_time_ms": round(inference_time_ms, 2),
        "uncertainty": {
            "top2_margin": confidence_margin,
            "entropy_norm": uncertainty_entropy,
        },
    }


def get_model_info() -> dict:
    """Return model identity and artifact metadata for runtime inspection."""
    return {
        "model_version": model_metadata.get("model_version", MODEL_VERSION),
        "model_file": model_metadata.get("model_file", MODEL_PATH.name),
        "model_path": str(MODEL_PATH),
        "labels_count": len(labels),
        "metadata": model_metadata,
    }