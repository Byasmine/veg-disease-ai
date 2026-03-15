# Load .env before any app config is imported (so GROQ_API_KEY etc. are available)
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.predict import router as predict_router
from app.routes.health import router as health_router
from app.routes.feedback import router as feedback_router
from app.routes.admin import router as admin_router

app = FastAPI(
    title="Vegetable Disease Detection API",
    description="AI vision engine for disease detection from images (e.g. smartphone photos). "
    "Includes diagnostic agent, human-in-the-loop feedback, review queue, Cloudinary storage, and Pinecone RAG.",
)

# Allow mobile app (Expo / React Native) and web to call the API from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(health_router)
app.include_router(feedback_router)
app.include_router(admin_router)