# CLAUDE.md — E-Commerce Platform Project Context

## Project Overview
Full-stack mini e-commerce platform with a customer storefront and admin panel, sharing a single NestJS backend. Built as part of a developer assessment.

## Repository
https://github.com/sardarumerjaved2668/assesment2.git

## Tech Stack
| Layer | Choice | Reason |
|-------|--------|--------|
| Backend | NestJS + TypeScript | Structured, decorator-based, great DI |
| Frontend | Next.js 14 (App Router) + TypeScript | SSR, file-based routing, React ecosystem |
| Database | **MongoDB + TypeORM (mongodb driver)** | Document model; flexible product/order shapes |
| Auth | JWT (7-day tokens) + bcrypt | Stateless, works well with SPA frontend |
| Styling | Tailwind CSS | Utility-first, fast prototyping |
| Image Storage | **Backend file upload via Multer → served at `/uploads`** | Self-contained; only the URL is stored in the DB. URL input also supported. |

## Folder Structure
```
company-test/
├── frontend/          # Next.js 14 App Router
├── backend/           # NestJS API
├── agents/            # Agent prompt files (documentation)
├── CLAUDE.md          # This file — project context for Claude sessions
├── NOTES.md           # Assessment notes (agent workflow, decisions)
└── README.md          # Setup and run instructions
```

## Architecture Decisions
- **Monorepo-style**: frontend/ and backend/ are sibling folders sharing one git repo.
- **Database**: MongoDB (local via Docker, or Atlas). Connection from `MONGODB_URI` + `DATABASE_NAME` (see `backend/src/config/database.config.ts`). Entities use TypeORM's `@ObjectIdColumn`.
- **Image upload (current approach)**: Images are uploaded to the **backend** via `POST /uploads/image` (Multer disk storage → `backend/uploads/`), which returns a public URL (`http://<host>/uploads/<file>`); only that URL is stored on the product. The folder is served statically via `app.useStaticAssets` in `main.ts`. The admin form also accepts a plain image **URL** as an alternative. (Cloudinary was the earlier approach and has been replaced — no third-party dependency now.)
- **Mock payment**: Backend `POST /orders/checkout` runs a clearly-mocked payment (test card `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` declines). No real payment SDK. Swap `processMockPayment` for Stripe in production.
- **Product suggestions**: `GET /products/:id/suggestions` returns same-category products; storefront shows a "You might also like" section.
- **Admin access**: `JwtAuthGuard + RolesGuard + @Roles('admin')` on all write endpoints. Frontend `app/admin/layout.tsx` redirects non-admin users to login.
- **Auth with fallback**: `AuthContext` tries the real backend (`POST /auth/login`); if unreachable it falls back to mock users. JWT stored in sessionStorage. Mock tokens are prefixed `mock_` — every page uses `token.startsWith('mock_')` to decide real API vs. simulated behavior.
- **API client**: `frontend/lib/api.ts` — all backend calls go through typed `fetch` functions that accept a `token`. No axios.

## Backend Module Status
| Module | Status | Notes |
|--------|--------|-------|
| Auth | ✅ Complete | Register, Login, JWT, Guards, `/auth/me`, bcrypt hashing |
| Users | ✅ Complete | Entity, Service, Module |
| Products | ✅ Complete | Full CRUD, paginated list, suggestions, admin guards |
| Uploads | ✅ Complete | `POST /uploads/image` (admin), Multer disk storage, static serving |
| Cart | ✅ Complete | Per-user DB persistence, line totals + total |
| Orders | ✅ Complete | Cart-based checkout, mock payment, history, status updates |
| Seed Script | ✅ Complete | admin@store.com / Admin123!, customer@store.com / Customer123! |

## Admin Product Management (assessment feature)
Fully implemented on both ends, secured by admin JWT.

**Backend** (`backend/src/products/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /products | None | List (paginated, search, filter, sort) |
| GET | /products/stats | Admin JWT | Stats for the dashboard |
| GET | /products/:id | None | Single product |
| GET | /products/:id/suggestions | None | Same-category suggestions (max 4) |
| POST | /products | Admin JWT | Create (validated by `CreateProductDto`) |
| PUT | /products/:id | Admin JWT | Update (validated by `UpdateProductDto`) |
| DELETE | /products/:id | Admin JWT | Delete |
| POST | /uploads/image | Admin JWT | Upload a product image (Multer, 5 MB, image-only) → returns `{ url }` |

Validation via `class-validator` DTOs (name length, price ≥ 0.01, stock ≥ 0, etc.). Write routes guarded by `JwtAuthGuard + RolesGuard + @Roles('admin')`.

**Frontend** (`frontend/app/admin/products/`)
| Page | Purpose |
|------|---------|
| `/admin/products` | Product listing (real API + dummy fallback), search, delete with confirmation modal |
| `/admin/products/new` | Add product form, validation, `ImageUpload` (upload or URL) |
| `/admin/products/[id]/edit` | Edit form, loads from API, `ImageUpload` |

`components/ImageUpload.tsx` handles both the file upload (to `POST /uploads/image`) and a manual URL tab, with drag-and-drop and preview.

### GET /products query params
- `search` — name/description substring match
- `category` — exact match
- `priceMin`, `priceMax` — number filters
- `sortBy` — `newest` | `oldest` | `price-asc` | `price-desc`
- `page`, `limit` — pagination (default page=1, limit=12, max limit=100)

## Backend API — Cart Endpoints (per-user, JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cart | Get current user's cart with line totals + total |
| POST | /cart | Add item `{ productId, quantity }` (stock-validated) |
| PUT | /cart/:productId | Set quantity (0 removes) |
| DELETE | /cart/:productId | Remove a line |
| DELETE | /cart | Clear the cart |

## Backend API — Orders Endpoints (JWT)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /orders/checkout | User | Convert cart → paid order (mock payment, stock decrement, clears cart) |
| POST | /orders | User | Create an order from explicit items |
| GET | /orders | User/Admin | Own orders (admins get all) |
| GET | /orders/:id | User/Admin | One order (ownership enforced) |
| PUT | /orders/:id/status | Admin | Update order status |

## Frontend Page Status
| Page | Status | Notes |
|------|--------|-------|
| / (catalog) | ✅ Complete | Real `fetchProducts` (search/filter/sort/pagination), dummy fallback |
| /products/[id] | ✅ Complete | Real API detail, add-to-cart with quantity, suggestions |
| /cart | ✅ Complete | Server-persisted cart for logged-in users, totals, loading/error |
| /checkout | ✅ Complete | Shipping + mock payment via `/orders/checkout` + confirmation |
| /orders | ✅ Complete | Real order history with status |
| /orders/[id] | ✅ Complete | Real order detail |
| /auth/login | ✅ Complete | Real backend login + mock fallback |
| /auth/register | ✅ Complete | Registration |
| /admin | ✅ Complete | Dashboard |
| /admin/products | ✅ Complete | Real API list, search, delete confirmation |
| /admin/products/new | ✅ Complete | Real API, image upload + URL |
| /admin/products/[id]/edit | ✅ Complete | Real API, image upload + URL |
| /admin/orders | ✅ Complete | Orders + status updates |

## Key Frontend Files
| File | Purpose |
|------|---------|
| `lib/api.ts` | Typed fetch client (products, cart, orders, checkout, uploads, auth) |
| `lib/dummy-data.ts` | Fallback data used when backend is unreachable |
| `context/AuthContext.tsx` | Real backend auth + mock fallback, JWT in sessionStorage |
| `context/CartContext.tsx` | Server-backed cart for logged-in users, localStorage for guests/demo |
| `components/ImageUpload.tsx` | Backend image upload (drag-drop) + URL tab |

## Credentials (Mock / Seed)
- **Admin**: admin@store.com / Admin123!
- **Customer**: customer@store.com / Customer123!

## Environment Variables

### Backend — `backend/.env`
```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/fullstack
DATABASE_NAME=fullstack
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```
(Config reads `MONGODB_URI` + `DATABASE_NAME` — see `src/config/database.config.ts`.)

### Frontend — `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
Uploaded images are served from the backend, so no third-party image env vars are required.

## Running the Project
```bash
# Local MongoDB (Docker)
docker run -d --name mongo -p 27017:27017 -v mongo_data:/data/db mongo:7

# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev

# Seed DB (after backend is running / mongo is up)
cd backend && npm run seed
```

## Commit History
- `design and auth` — initial UI/UX structure + auth module
- `admin panel and product module integration` — Products CRUD API, admin panel wired to real API, image upload
- `product image upload using multer` — switched image storage from Cloudinary to backend Multer + static serving
- `product detail page` — storefront product detail wired to real API
- `orders pages` — orders history + detail
- `cart functionality and other mistakes covered` — server-side cart, checkout/orders integration

## Known Issues / Watch Out For
- `next.config.mjs` must use JSDoc types (`/** @type */`), NOT `import type` syntax. Remote image hosts are whitelisted under `images.domains` (includes `localhost` for uploaded images).
- TypeORM `synchronize: true` is fine for dev, must be `false` in production.
- ObjectId is serialized to a hex string in JSON responses — frontend `Product.id` / `Order.id` are strings.
- Auth token in sessionStorage (logged out on tab close — acceptable for assessment). Mock tokens start with `mock_`.
- The backend must be **restarted** after backend code changes for new routes to load; confirm endpoints at `http://localhost:3001/api/docs`.
- `backend/uploads/` holds uploaded images; only `.gitkeep` is tracked (binaries are git-ignored).
