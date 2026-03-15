# Deploying veg-disease-ai

The repo has two top-level folders: **`backend/`** (FastAPI API) and **`mobile/`** (Expo app). Deploy the backend first, then point the mobile app at its URL.

---

## Backend (Railway)

All backend code lives in **`backend/`**: `app/`, `artifacts/`, `data/`, `requirements.txt`, `Dockerfile`, `railway.json`.

### 1. Deploy on Railway

1. Create a new project on [Railway](https://railway.app).
2. Connect your repo and set **Root Directory** to **`backend`** (so the Dockerfile in `backend/` is used).
3. Add **variables** in the Railway service (same as `backend/.env.example`):
   - `GROQ_API_KEY` (or `OPENAI_API_KEY`) for LLM reasoning
   - `CLOUDINARY_*` if you use feedback-with-image
   - `PINECONE_*` if you use RAG
   - No need to set `PORT`; Railway injects it.
4. Deploy. Railway will build from `backend/` and run:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. In **Settings → Networking**, generate a **public domain** (e.g. `your-app.up.railway.app`). This is your **API base URL** for the mobile app.

### 2. Health check

- Railway is configured to use **`/health`** as the healthcheck path (`backend/railway.json`).
- After deploy, open `https://your-app.up.railway.app/health` to confirm the API is up.

### 3. Local backend (no Docker)

```bash
cd backend
# Copy your .env into backend/ or create backend/.env from backend/.env.example
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then open http://localhost:8000/health and http://localhost:8000/docs.

### 4. Local Docker (optional)

```bash
cd backend
docker build -t veg-disease-backend .
docker run -p 8000:8000 --env-file .env veg-disease-backend
```

---

## Mobile app (Expo)

The app reads the API URL from **`EXPO_PUBLIC_API_URL`**. For production (e.g. EAS or a build that talks to Railway), set this to your Railway URL.

### Local development

- Default is **`http://localhost:8000`** (see `mobile/src/config.ts`).
- For a physical device on the same Wi‑Fi, either:
  - Run the backend on your machine and set `EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:8000` in `mobile/.env`, or
  - Use your Railway URL: `EXPO_PUBLIC_API_URL=https://your-app.up.railway.app`

### Production build (EAS / release)

Set the env var when building, e.g.:

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app npx eas build --platform android
```

Or in `mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
```

Then run `npx expo start` or your usual build command. The built app will use that URL.

---

## Summary

| Part    | Location   | Deploy / run |
|---------|------------|--------------|
| Backend | `backend/` | Railway (set Root Directory = `backend`); or local: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| Mobile  | `mobile/`  | Expo / EAS; set `EXPO_PUBLIC_API_URL` to your Railway (or local) API URL |

Backend and mobile are independent. For local dev, run the backend from `backend/` (with `backend/.env`) and the mobile app from `mobile/`.
