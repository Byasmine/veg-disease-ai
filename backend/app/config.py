"""API and model configuration."""

import os

# Model identity (bump when you deploy a new model)
MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")
MODEL_FILENAME = os.getenv("MODEL_FILENAME", "model_v1.onnx")

# Confidence thresholds for status
# confidence >= HIGH  -> Success
# LOW <= confidence < HIGH -> Uncertain (recommend human review)
# confidence < LOW or error -> Failure
CONFIDENCE_THRESHOLD_HIGH = float(os.getenv("CONFIDENCE_THRESHOLD_HIGH", "0.85"))
CONFIDENCE_THRESHOLD_LOW = float(os.getenv("CONFIDENCE_THRESHOLD_LOW", "0.50"))

# Workflow decision thresholds for product operation states:
# ACCEPTED, REVIEW, REJECTED
WORKFLOW_ACCEPT_MIN_SCORE = float(os.getenv("WORKFLOW_ACCEPT_MIN_SCORE", "0.75"))
WORKFLOW_REVIEW_MIN_SCORE = float(os.getenv("WORKFLOW_REVIEW_MIN_SCORE", "0.45"))
WORKFLOW_REJECT_MAX_MODEL_CONFIDENCE = float(os.getenv("WORKFLOW_REJECT_MAX_MODEL_CONFIDENCE", "0.35"))

# Uncertainty signals (used by orchestration)
UNCERTAINTY_MARGIN_THRESHOLD = float(os.getenv("UNCERTAINTY_MARGIN_THRESHOLD", "0.15"))
UNCERTAINTY_ENTROPY_THRESHOLD = float(os.getenv("UNCERTAINTY_ENTROPY_THRESHOLD", "0.50"))

# Fusion weights (sum should be 1.0)
FUSION_WEIGHT_MODEL = float(os.getenv("FUSION_WEIGHT_MODEL", "0.60"))
FUSION_WEIGHT_RULE = float(os.getenv("FUSION_WEIGHT_RULE", "0.25"))
FUSION_WEIGHT_LLM = float(os.getenv("FUSION_WEIGHT_LLM", "0.15"))

# Top-K predictions to return
TOP_K_DEFAULT = 3

# Optional LLM reasoning agent (RAG + plant-disease knowledge)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")  # e.g. Azure or local endpoint
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
# Groq (OpenAI-compatible API; fast inference)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")  # was llama-3.1-70b (decommissioned)
REASONING_ENABLED = bool(OPENAI_API_KEY or GROQ_API_KEY)

# Cloudinary (cloud storage for images)
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
CLOUDINARY_FOLDER = os.getenv("CLOUDINARY_FOLDER", "veg-disease")
CLOUDINARY_ENABLED = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)

# Pinecone (vector DB for RAG)
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "veg-disease-knowledge")
PINECONE_HOST = os.getenv("PINECONE_HOST", "")  # optional; index host from dashboard
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "default")
PINECONE_ENABLED = bool(PINECONE_API_KEY)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIM = 1536  # text-embedding-3-small

# Retraining pipeline (MLOps)
MIN_RETRAINING_SAMPLES = int(os.getenv("MIN_RETRAINING_SAMPLES", "50"))
WEAKNESS_LABEL_THRESHOLD = int(os.getenv("WEAKNESS_LABEL_THRESHOLD", "20"))  # high corrections for a label
MIN_IMAGE_RESOLUTION = int(os.getenv("MIN_IMAGE_RESOLUTION", "128"))  # min width and height in pixels
