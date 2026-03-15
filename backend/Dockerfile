# Backend image for Railway (or any container host).
# Build from backend/ directory: docker build -t veg-disease-backend .

FROM python:3.10-slim

WORKDIR /app

COPY app/ ./app/
COPY artifacts/ ./artifacts/
COPY data/ ./data/
COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

# Railway injects PORT at runtime; default 8000 for local Docker
CMD ["/bin/sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
