# Shop Backend (Express.js)

E-commerce and **JWT auth** for the Leaf Doctor app, backed by **PostgreSQL**. Fits Railway: add Postgres, set `DATABASE_URL`, deploy the included **Dockerfile**.

Catalog, cart, and orders are stored in the database (migrations seed categories/products from `data/*.json`).

## Run locally

1. Start Postgres (Docker):

   ```bash
   cd shop-backend
   docker compose up -d
   ```

2. Configure env:

   ```bash
   cp .env.example .env
   # JWT_SECRET (≥16 random chars). DATABASE_URL matches compose by default.
   ```

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Server: `http://localhost:8082` (migrations run on startup).

**Refreshing the product catalog** after `data/*.json` changes: new rows upsert by id, but **removed ids stay in the database**. For a clean re-seed in development, set **`CATALOG_RESET=true`** once in `.env`, restart the server, then remove it (this deletes all `cart_items` and replaces `categories` / `products` from JSON).

### Useful env vars

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Required; signs access tokens |
| `PUBLIC_BASE_URL` | Public URL of this API (avatar links). Use LAN IP or HTTPS in production so clients can load `/uploads/...` |
| `SMTP_*`, `EMAIL_FROM` | Optional; OTP emails. Without SMTP, OTPs are logged to the console (dev) |
| `DATABASE_SSL` | Set `false` for local Postgres; hosted DBs often need TLS (see `.env.example`) |

**SMTP:** Port **587** uses STARTTLS → `SMTP_SECURE=false`. Port **465** uses implicit TLS → `SMTP_SECURE=true`. Mixing **587 + `SMTP_SECURE=true`** causes TLS errors.

## Railway (Docker)

- Add **PostgreSQL**; set **`DATABASE_URL`** and **`JWT_SECRET`** on the shop service.
- Set **`PUBLIC_BASE_URL`** to your deployed service URL (for avatar URLs).
- Deploy with **`Dockerfile`** in `shop-backend/`.
- If TLS to Postgres fails, try `DATABASE_SSL_REJECT_UNAUTHORIZED=false` (see `.env.example`).

## API

Base: `http://localhost:8082` (or your host).

### Auth — `/api/auth`

| Method | Path | Notes |
|--------|------|--------|
| POST | `/register` | Start signup (profile + address); sends email OTP |
| POST | `/verify-signup` | `{ email, code }` → `{ user, token }` |
| POST | `/resend-signup-otp` | `{ email }` |
| POST | `/login` | `{ email, password }` (requires verified email) |
| POST | `/forgot-password` | Sends reset OTP |
| POST | `/reset-password` | `{ email, code, newPassword }` |
| POST | `/change-password` | Bearer token; `{ currentPassword, newPassword }` |
| GET | `/me` | Bearer token → current user |

### User — `/api/user` (Bearer)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/profile` | Current user |
| PATCH | `/profile` | Update name, phone, address fields |
| POST | `/avatar` | `multipart/form-data`, field **`photo`** (or `file`), max 2MB, image types only |

### Shop — `/api/shop`

**No auth:** `GET /health`, `GET /categories`, `GET /products`, `GET /products/:id`.

**Bearer required:** cart, checkout, orders.

| Method | Path | Body (examples) |
|--------|------|-----------------|
| GET | `/cart` | — |
| POST | `/cart/items` | `{ productId, quantity }` |
| PATCH | `/cart/items/:itemId` | `{ quantity }` |
| DELETE | `/cart/items/:itemId` | — |
| DELETE | `/cart` | — |
| POST | `/checkout` | `{ paymentMethod, shipping?: { ... } }` |
| GET | `/orders` | — |
| GET | `/orders/:id` | — |

Static files: **`GET /uploads/avatars/...`** (avatar uploads).

## Mobile app

Set **`EXPO_PUBLIC_SHOP_API_URL`** in `mobile/.env` to this API’s base URL. The app browses the shop as a guest; it sends **`Authorization: Bearer <token>`** for cart, checkout, orders, analyze-gated flows, and profile.
