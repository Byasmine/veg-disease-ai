# Shop Backend (Express.js)

Separate e-commerce backend for the agriculture shop. This is independent from the AI backend in `backend/`.

## Features

- Categories and products catalog
- Cart management per user
- Simulated checkout and order history
- Simple auth placeholder via `x-user-id` header (easy local testing)

## Run locally

```bash
cd shop-backend
npm install
npm run dev
```

Server starts on `http://localhost:8082`.

## API

Base: `http://localhost:8082/api/shop`

- `GET /health`
- `GET /categories`
- `GET /products?categoryId=&q=`
- `GET /products/:id`

Authenticated (send header `x-user-id: user_123`):

- `GET /cart`
- `POST /cart/items` body `{ "productId": "...", "quantity": 1 }`
- `PATCH /cart/items/:itemId` body `{ "quantity": 3 }`
- `DELETE /cart/items/:itemId`
- `DELETE /cart`
- `POST /checkout` body `{ "paymentMethod": "simulated-card" }`
- `GET /orders`
- `GET /orders/:id`

## Data storage

Uses JSON files under `data/` for MVP:

- `categories.json`
- `products.json`
- `carts.json`
- `orders.json`

You can swap this later for Postgres/Mongo without changing the route contract.
