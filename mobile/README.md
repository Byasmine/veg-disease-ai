# Vegetable Disease Detection – Mobile (Expo)

React Native + Expo MVP: capture or pick a leaf image, get prediction and treatment advice.

## Run

1. **AI backend** (Python, from repo `backend/`):
   ```bash
   uvicorn app.main:app --reload
   ```
   Default: `http://localhost:8000`.

2. **Shop + auth backend** (Node, JWT + PostgreSQL, from repo `shop-backend/`):
   ```bash
   docker compose up -d   # Postgres
   cp .env.example .env   # set JWT_SECRET, DATABASE_URL
   npm run dev
   ```
   Default: `http://localhost:8082`. The app uses this API for **shop + auth**. You can **browse the shop without signing in**; sign-in is required for **cart, checkout, orders**, and the **Analyze** tab (per app gates). Bearer token is sent on those requests.

3. **Start the app**:
   ```bash
   npm run web      # Browser
   npm run android  # Android emulator
   npm start        # Expo Go on device
   ```

   **Expo Go:** Use a current Expo Go build matching SDK 55.

## Environment URLs

Create **`mobile/.env`** (loaded via `app.config.js`). Restart with `npx expo start -c` after changes.

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | AI backend (predict, etc.) |
| `EXPO_PUBLIC_SHOP_API_URL` | Shop backend + JWT auth (`/api/auth`, `/api/shop`) |

- **Web (same PC):** `http://localhost:8000` and `http://localhost:8082`
- **Android emulator:** AI `http://10.0.2.2:8000`, shop `http://10.0.2.2:8082`
- **Physical device (same Wi‑Fi):** use your PC’s LAN IP for both ports

Auth is **email + password** via `shop-backend` (register signs you in immediately; no email OTP). Use **Change password** in the app when signed in. No Firebase.

Set shop **`PUBLIC_BASE_URL`** to a URL clients can reach (e.g. your PC’s LAN IP or deployed API) so **profile avatars** (`/uploads/avatars/...`) load on devices—not only `http://localhost:8082`.

## Flow

1. **Shop / home hub** — open categories and products as a guest.
2. **Sign in** when you want **Analyze**, **cart**, **checkout**, or **orders** (JWT from `shop-backend`).
3. **Register** → account is created and you are signed in (same as sign-in with JWT).
4. **Take photo** or **pick from gallery** (Analyze) → `POST /predict-with-reasoning` on the AI backend.
5. Result screen shows diagnosis, treatment, and optional PDF export.
