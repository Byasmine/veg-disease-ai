# React Native + Expo mobile MVP – pre-flight checklist

Use this **before** you start building the app so you have everything in place.

---

## Running the mobile app (already created)

The app lives in the **`mobile/`** folder.

```bash
cd mobile
npm run web      # Open in browser (easiest on Windows)
npm run android  # Android emulator (if Android Studio installed)
```

- **Windows:** iOS Simulator is not available (macOS only). Use **Expo web** (`npm run web`) or **Expo Go** on your real iPhone (same Wi‑Fi as PC, set `API_BASE_URL` in `mobile/config.js` to your PC’s IP, e.g. `http://192.168.1.100:8000`).
- **Real iPhone:** Install **Expo Go** from the App Store, run `npm start` in `mobile/`, scan the QR code. Ensure `mobile/config.js` uses your PC’s LAN IP so the phone can reach the API.

---

## 1. Backend readiness

| Check | What to verify |
|-------|----------------|
| API runs | `uvicorn app.main:app --reload` and open `http://localhost:8000/docs` |
| Health | `GET http://localhost:8000/health` returns `{"status":"ok","model_version":"1.0.0"}` |
| Predict | `POST http://localhost:8000/predict` with an image file returns `status`, `prediction`, `confidence`, `diagnostic_report`, `agent_decision` |
| Predict with reasoning (optional) | `POST http://localhost:8000/predict-with-reasoning` returns same + `llm_reasoning` when Groq/OpenAI is configured |
| CORS | Backend has CORS enabled (already added in `main.py`) so the app can call it from another origin (e.g. Expo web or device using your PC’s IP) |

**Base URL for the mobile app** – set in `mobile/config.js` as `API_BASE_URL`:

- **Expo web (browser on same PC):** `http://localhost:8000`
- **Android emulator:** `http://10.0.2.2:8000`
- **iOS Simulator (macOS only):** `http://localhost:8000`
- **Physical device (iPhone/Android on same Wi‑Fi as PC):** Your PC’s LAN IP, e.g. `http://192.168.1.100:8000` (run `ipconfig` on Windows to find it).
- **Production:** Your deployed API URL, e.g. `https://api.yourproject.com`.

---

## 2. API contract (what the mobile app will use)

### Prediction

- **Endpoint:** `POST /predict` or `POST /predict-with-reasoning`
- **Request:** `multipart/form-data` with one field: `file` (image: JPEG, PNG, or WebP).
- **Response (200):**
```json
{
  "status": "Success" | "Uncertain" | "Failure",
  "prediction": "Septoria_leaf_spot",
  "confidence": 0.92,
  "top_k": [{"label": "...", "confidence": 0.92}, ...],
  "diagnostic_report": {
    "summary": "...",
    "recommended_treatment": "..."
  },
  "agent_decision": {
    "review_needed": false,
    "reason": "",
    "next_action": "Provide treatment guidance"
  },
  "model_version": "1.0.0",
  "inference_time_ms": 12.5,
  "llm_reasoning": null | { "reasoning": "...", "recommendation": "...", "verdict": "agree"|"uncertain"|"disagree" }
}
```

- **Errors:** 422 (invalid image), 500 (inference failed) with `detail: { "status": "Failure", "message": "...", "error": "..." }`.

### Feedback (optional for MVP)

- **Endpoint:** `POST /feedback`  
  **Body (JSON):** `predicted_label`, `correct_label`, `confidence`, optional `user_comment`, `image_id`.
- **With image:** `POST /feedback/with-image`  
  **Body (multipart):** `predicted_label`, `correct_label`, `confidence`, optional `user_comment`, `image` (file).

---

## 3. Your dev machine (React Native + Expo)

| Requirement | How to check / install |
|-------------|------------------------|
| Node.js | `node -v` → v18 or v20 recommended (LTS). [nodejs.org](https://nodejs.org) |
| npm or Yarn | `npm -v` or `yarn -v` |
| Expo CLI | `npx expo --version` (no global install needed; use `npx expo`) |
| Expo Go (optional) | Install **Expo Go** on your phone from App Store / Play Store to run the app on device |
| Android Studio (optional) | Only if you want an Android emulator; not required if you use Expo Go on a real device |
| Xcode (optional) | Only for iOS simulator on macOS; not required if you use Expo Go on a real device |

**Quick test**

```bash
npx create-expo-app@latest my-app --template blank
cd my-app
npx expo start
```

- Press `w` for web, or scan the QR code with Expo Go on your phone. If that works, you’re ready to build the MVP.

---

## 4. MVP scope (suggested)

- **Screen 1 – Capture / pick image:** Camera or gallery → one image.
- **Screen 2 – Result:** Show `status`, `prediction`, `confidence`, `diagnostic_report.summary`, `diagnostic_report.recommended_treatment`, and optionally `agent_decision.next_action` and `llm_reasoning.reasoning` / `recommendation`.
- **Screen 3 (optional):** Simple feedback form: “Was this correct?” → if not, send `POST /feedback` (or `/feedback/with-image`) with predicted vs correct label and confidence.
- **Config:** One place (e.g. env or config file) to set the **API base URL** (localhost, LAN IP, or production).

---

## 5. Checklist summary

- [ ] Backend runs; `/health` and `/predict` work in browser or Postman.
- [ ] CORS is enabled on the backend (already in `main.py`).
- [ ] Node.js (v18+) and npm/yarn installed.
- [ ] `npx expo start` runs a blank Expo app (web or Expo Go).
- [ ] You know which **base URL** to use (emulator vs device vs production).
- [ ] (Optional) Groq/OpenAI configured so `/predict-with-reasoning` returns `llm_reasoning`.

Once all of the above are done, you’re ready to create the Expo app and implement the MVP screens and API calls.
