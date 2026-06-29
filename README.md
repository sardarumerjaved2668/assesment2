# ShopNext — Full-Stack E-Commerce Platform

A complete mini e-commerce platform with a customer storefront and admin panel, built with Next.js 14 + NestJS + PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, TypeORM |
| Database | PostgreSQL |
| Auth | JWT (7-day tokens), bcrypt (12 rounds) |

## Project Structure

```
company-test/
├── frontend/     # Next.js 14 App Router
├── backend/      # NestJS API (port 3001)
├── agents/       # Agent prompt files
├── CLAUDE.md     # Project context for Claude sessions
└── NOTES.md      # Assessment notes and decisions
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

## Setup

### 1. Clone and install

```bash
git clone https://github.com/sardarumerjaved2668/assesment2.git
cd assesment2
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

**.env values:**
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=ecommerce_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
```

Create the database:
```bash
psql -U postgres -c "CREATE DATABASE ecommerce_db;"
```

Start the backend (auto-creates tables via TypeORM synchronize):
```bash
npm run start:dev
```

Run the seed script (in a new terminal):
```bash
npx ts-node src/seed/seed.ts
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**  
Backend runs on **http://localhost:3001**  
API docs (Swagger) at **http://localhost:3001/api/docs**

## Seeded Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@store.com | Admin123! |
| Customer | customer@store.com | Customer123! |

## Features

### Customer Storefront
- Product catalog with search, filter by category/price, sort, pagination
- Product detail pages with add-to-cart and "You might also like" suggestions
- Shopping cart (localStorage persisted)
- 3-step checkout: address → mock payment → confirmation
- Order history for logged-in customers
- Authentication (login / register)

### Admin Panel (`/admin`)
- Dashboard with sales stats and SVG bar chart
- Product management (create, edit, delete)
- Order management with status lifecycle updates
- Restricted to admin role users only

## Backend API (Implemented)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | None | Create new account |
| POST | /auth/login | None | Login, returns JWT |
| GET | /auth/me | JWT | Current user info |
| GET | /health | None | Health check |

Stub endpoints (return 501, to be implemented):
- `GET/POST /products`, `GET/PUT/DELETE /products/:id`
- `GET/POST /orders`, `GET /orders/:id`, `PUT /orders/:id/status`
- `GET/POST /cart`, `PUT/DELETE /cart/:id`

## Running Tests

```bash
cd backend
npm run test:e2e
```

## Notes

- Frontend currently uses **dummy/mock data** — no real API calls. Wire up by replacing imports from `lib/dummy-data.ts` with `fetch()` calls to `http://localhost:3001`.
- Mock payment uses a Stripe-style UI in test mode — no real charges.
- See `NOTES.md` for full architecture decisions and agent workflow notes.
