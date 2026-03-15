# Routes & endpoints reference

Single place to see **all API endpoints** (backend) and **all app routes** (mobile screens), and how they map so you know how many components you need.

---

## 1. Backend API endpoints (FastAPI)

Base URL: `http://localhost:8000` (or your deployed URL).

| Method | Endpoint | Purpose | Used by mobile? |
|--------|----------|---------|------------------|
| **GET** | `/health` | API + model version check | Optional (e.g. splash) |
| **POST** | `/predict` | Predict disease from image (no LLM) | Alternative to below |
| **POST** | `/predict-with-reasoning` | Predict + LLM reasoning (RAG) | ✅ HomeScreen |
| **POST** | `/feedback` | Submit feedback (JSON: predicted_label, correct_label, confidence, comment) | ✅ FeedbackScreen |
| **POST** | `/feedback/with-image` | Submit feedback + upload image to Cloudinary (multipart) | Not yet |
| **GET** | `/review-queue` | List cases pending human review | Admin/dashboard |
| **POST** | `/review-case` | Apply decision: approve / correct / mark_for_retraining / reject | Admin/dashboard |
| **POST** | `/admin/index-knowledge` | Index knowledge into Pinecone (RAG) | Admin/tooling |
| **GET** | `/admin/retraining-candidates` | List cases marked for retraining | Admin/dashboard |
| **GET** | `/admin/retraining-stats` | Stats for learning (count by label, etc.) | Admin/dashboard |
| **POST** | `/admin/export-retraining-dataset` | Export retraining dataset (download images, manifest) | Admin/tooling |

**Summary:** 11 endpoints. Mobile app currently uses **3**: `GET /health` (optional), `POST /predict-with-reasoning`, `POST /feedback`.

---

## 2. Mobile app routes (screens / components)

Stack navigator: one screen at a time, back/forward.

| Route name | Screen component | Purpose | API used |
|------------|------------------|---------|----------|
| **Home** | `HomeScreen` | Take photo / Pick from gallery → run prediction | `POST /predict-with-reasoning` |
| **Result** | `ResultScreen` | Show prediction, summary, treatment, AI reasoning; “Scan another”, “Report wrong result” | — (receives data from Home) |
| **Feedback** | `FeedbackScreen` | Form: correct diagnosis + comment → submit | `POST /feedback` |

**Summary:** 3 screens. No extra “components” required for these routes beyond the 3 screen files.

---

## 3. How many components you need (by scope)

- **MVP (current):** 3 screens (Home, Result, Feedback) + 1 navigator. API: 2–3 endpoints (predict-with-reasoning, feedback, optional health).
- **With “feedback with image”:** +1 flow in FeedbackScreen (or a separate screen) calling `POST /feedback/with-image`. Still 3 main screens.
- **Review queue (agronomist):** +1 screen (e.g. `ReviewQueueScreen`) → `GET /review-queue`, list items, open detail → +1 screen (e.g. `ReviewCaseScreen`) → `POST /review-case`. So **+2 screens** for review.
- **Admin (retraining / knowledge):** Usually a separate web app or admin section. If you put it in the same app: e.g. **+1 Admin stack** with screens for index-knowledge, retraining-candidates, retraining-stats, export-retraining-dataset → **about 2–4 screens** depending on how you group them.

---

## 4. Quick list for implementation

**Backend (11 endpoints):**

1. `GET /health`
2. `POST /predict`
3. `POST /predict-with-reasoning`
4. `POST /feedback`
5. `POST /feedback/with-image`
6. `GET /review-queue`
7. `POST /review-case`
8. `POST /admin/index-knowledge`
9. `GET /admin/retraining-candidates`
10. `GET /admin/retraining-stats`
11. `POST /admin/export-retraining-dataset`

**Mobile screens (3 today):**

1. **Home** – capture/pick → predict
2. **Result** – show result + actions
3. **Feedback** – submit wrong-result feedback

**Optional next components (if you add them):**

- Screen or flow for **feedback with image** → `POST /feedback/with-image`
- **ReviewQueue** + **ReviewCase** screens → `/review-queue`, `/review-case`
- **Admin** screens (or web only) → `/admin/*`

Use this file to plan how many components you need for the scope you want.
