from fastapi import APIRouter
from app.config import MODEL_VERSION

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}
