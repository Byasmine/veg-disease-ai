# Vegetable Disease Detection API (Backend)

FastAPI service for leaf disease prediction, LLM reasoning, feedback, and RAG. Runs independently from the `mobile/` app.

## Local setup

```bash
cd backend
pip install -r requirements.txt
# Copy your env: cp ../.env .env  (or create .env from .env.example)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

## Deploy (Railway)

Set Railway **Root Directory** to `backend`. See root **DEPLOY.md** for full steps.

## Layout

- `app/` – FastAPI app, routes, services (inference, RAG, feedback)
- `artifacts/` – ONNX model and labels
- `data/` – feedback cases and retraining data (created at runtime)
