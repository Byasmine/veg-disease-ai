import json
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image

from app.config import MODEL_VERSION, REASONING_ENABLED
from app.services.inference import predict
from app.services.reasoning_agent import reason

router = APIRouter()

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"
LABELS_PATH = ARTIFACTS_DIR / "labels.json"


@router.get("/labels", summary="Get list of disease labels (for feedback form)")
async def get_labels():
    """Return the list of class labels from artifacts/labels.json."""
    if not LABELS_PATH.exists():
        return []
    with open(LABELS_PATH) as f:
        return json.load(f)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail={
                "status": "Failure",
                "message": f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
            },
        )

    try:
        image = Image.open(file.file).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail={
                "status": "Failure",
                "message": "Could not decode image. Ensure the file is a valid image.",
                "error": str(e),
            },
        )

    try:
        result = predict(image)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "Failure",
                "message": "Inference failed.",
                "model_version": MODEL_VERSION,
                "error": str(e),
            },
        )


@router.post(
    "/predict-with-reasoning",
    summary="Predict with optional LLM reasoning (RAG + plant-disease knowledge)",
)
async def predict_with_reasoning(file: UploadFile = File(...)):
    """
    Same as POST /predict, but adds an optional LLM reasoning layer when OPENAI_API_KEY is set.
    Returns prediction + agent_decision + llm_reasoning (reasoning, recommendation, verdict).
    """
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail={
                "status": "Failure",
                "message": f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
            },
        )

    try:
        image = Image.open(file.file).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail={
                "status": "Failure",
                "message": "Could not decode image. Ensure the file is a valid image.",
                "error": str(e),
            },
        )

    try:
        result = predict(image)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "Failure",
                "message": "Inference failed.",
                "model_version": MODEL_VERSION,
                "error": str(e),
            },
        )

    # Optional LLM reasoning (RAG over diagnostics + knowledge)
    if REASONING_ENABLED:
        llm = reason(result)
        result["llm_reasoning"] = llm
    else:
        result["llm_reasoning"] = None  # Set OPENAI_API_KEY to enable

    return result
