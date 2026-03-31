from fastapi import APIRouter
from app.config import MODEL_VERSION
from app.services.inference import get_model_info
from app.services.monitoring import summary as monitoring_summary

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}


@router.get("/model/info", summary="Get active model metadata")
def model_info():
    return get_model_info()


@router.get("/metrics/summary", summary="Runtime KPI summary (in-memory)")
def metrics_summary():
    return monitoring_summary()
