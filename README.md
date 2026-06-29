# ShopNext — Full-Stack E-Commerce Platform

A complete mini e-commerce platform with a customer storefront and admin panel, built with Next.js 14 + NestJS + MongoDB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, TypeORM (MongoDB driver) |
| Database | MongoDB (local via Docker or Atlas) |
| Auth | JWT (7-day tokens), bcrypt |
| Images | Multer (backend disk storage → served at `/uploads`) |

## Project Structure

```
company-test/
├── frontend/     # Next.js 14 App Router (port 3000)
├── backend/      # NestJS API (port 3001)
├── agents/       # Agent prompt files
├── CLAUDE.md     # Project context for Claude sessions
├── NOTES.md      # Assessment notes and decisions
└── README.md     # This file
```

## Prerequisites

- Node.js 18+
- Docker (for local MongoDB or full-stack Docker Compose) — or a MongoDB Atlas connection string

## Quick Start (Docker Compose — recommended)

Runs the full stack (MongoDB + backend + frontend) in one command:

```bash
git clone https://github.com/sardarumerjaved2668/assesment2.git
cd assesment2
docker-compose up --build
```

Then seed the database (wait for backend to start first):

```bash
docker exec -it shopnext-backend node dist/seed/seed.js
```

- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:3001**
- Swagger docs: **http://localhost:3001/api/docs**

---

## Manual Setup (local dev)

### 1. Clone and install

```bash
git clone https://github.com/sardarumerjaved2668/assesment2.git
cd assesment2
```

### 2. Start MongoDB (Docker)

```bash
docker run -d --name mongo -p 27017:27017 -v mongo_data:/data/db mongo:7
```

### 3. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/fullstack
DATABASE_NAME=fullstack
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

Start the backend:

```bash
npm run start:dev
```

Seed the database (in a new terminal, after the backend is running):

```bash
npm run seed
```

### 4. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

- Frontend: **http://localhost:3000**
- Backend: **http://localhost:3001**
- Swagger API docs: **http://localhost:3001/api/docs**

## Seeded Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@store.com | Admin123! |
| Customer | customer@store.com | Customer123! |

## Features

### Customer Storefront

- Product catalog with search, filter (category/price range), sort, pagination
- Product detail pages with add-to-cart and **"You might also like"** suggestions (same-category)
- Shopping cart — server-persisted for logged-in users, line totals + order total
- 3-step checkout: shipping address → mock payment → confirmation
- Mock payment: card `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` declines
- Order history and detail for logged-in customers
- Authentication: register, login, JWT session restore

### Admin Panel (`/admin`)

- **Dashboard** — total sales, order count by status, top-selling products, interactive Recharts charts (bar, donut, area)
- **Product management** — create, edit, delete; image upload (drag-drop via Multer) or URL
- **Order management** — view all orders, inline status updates (`pending → processing → shipped → delivered`, `cancelled`)
- Restricted to admin-role users only (backend guards + frontend layout redirect)

## Backend API

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | None | Create account |
| POST | /auth/login | None | Login, returns JWT |
| GET | /auth/me | JWT | Current user info |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /products | None | List (search, filter, sort, paginate) |
| GET | /products/:id | None | Single product |
| GET | /products/:id/suggestions | None | Same-category suggestions (max 4) |
| POST | /products | Admin JWT | Create product |
| PUT | /products/:id | Admin JWT | Update product |
| DELETE | /products/:id | Admin JWT | Delete product |
| POST | /uploads/image | Admin JWT | Upload product image (Multer, 5 MB) |

### Cart (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cart | Get cart with line totals |
| POST | /cart | Add item `{ productId, quantity }` |
| PUT | /cart/:productId | Set quantity (0 removes item) |
| DELETE | /cart/:productId | Remove item |
| DELETE | /cart | Clear cart |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /orders/checkout | User JWT | Cart → paid order (mock payment, stock decrement) |
| GET | /orders | User/Admin JWT | Own orders (admin sees all) |
| GET | /orders/:id | User/Admin JWT | Order detail |
| PUT | /orders/:id/status | Admin JWT | Update status |
| GET | /orders/stats | Admin JWT | Dashboard analytics |

## Running Tests

```bash
cd backend
npm run test
```

Tests cover: mock payment logic, stock validation at checkout, cart operations, product suggestions.

## Notes

- `backend/uploads/` holds uploaded images; only `.gitkeep` is tracked (binaries are git-ignored).
- TypeORM `synchronize: true` is on for development — set `false` in production.
- See `NOTES.md` for full architecture decisions, agent workflow, and trade-offs.
