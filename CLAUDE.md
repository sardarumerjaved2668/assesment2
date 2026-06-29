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
| Database | PostgreSQL + TypeORM | Relational integrity for orders/stock |
| Auth | JWT (7-day tokens) | Stateless, works well with SPA frontend |
| Styling | Tailwind CSS | Utility-first, fast prototyping |
| Image Storage | Cloudinary (free tier) unsigned upload | No backend storage needed, URL stored in DB |

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
- **Monorepo-style**: frontend/ and backend/ are sibling folders sharing one git repo
- **Image upload**: Cloudinary unsigned upload directly from browser — no backend storage. Frontend uploads to Cloudinary, gets back a URL, stores that URL via the products API. Falls back to manual URL input if Cloudinary env vars not set.
- **Mock payment**: Stripe test-mode UI mocked in frontend; no real payment SDK integrated
- **Product suggestions**: On backend: `GET /products/:id/suggestions` returns same-category products. Frontend: "You might also like" section calls this endpoint (falls back to dummy data).
- **Admin access**: `JwtAuthGuard + RolesGuard + @Roles('admin')` on all write endpoints. Frontend admin layout redirects non-admin users.
- **Auth with fallback**: AuthContext tries real backend (`POST /auth/login`), falls back to mock if backend is unreachable. JWT stored in sessionStorage.
- **API client**: `frontend/lib/api.ts` — all backend calls go through typed fetch functions that accept a `token` parameter. No axios dependency.

## Backend Module Status
| Module | Status | Notes |
|--------|--------|-------|
| Auth | ✅ Complete | Register, Login, JWT, Guards, Decorators |
| Users | ✅ Complete | Entity, Service, Module |
| Products | ✅ Complete | Full CRUD, paginated list, suggestions endpoint, admin guards |
| Orders | 🔲 Stub | Entity done, controller returns 501 |
| Cart | 🔲 Stub | Entity done, controller returns 501 |
| Seed Script | ✅ Complete | admin@store.com / Admin123!, customer@store.com / Customer123! |

## Backend API — Products Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /products | None | List (paginated, search, filter, sort) |
| GET | /products/stats | Admin JWT | Product stats for dashboard |
| GET | /products/:id | None | Single product |
| GET | /products/:id/suggestions | None | Same-category suggestions (max 4) |
| POST | /products | Admin JWT | Create product |
| PUT | /products/:id | Admin JWT | Update product |
| DELETE | /products/:id | Admin JWT | Delete product |

### Query params for GET /products
- `search` — name/description substring match
- `category` — exact match
- `priceMin`, `priceMax` — number filters
- `sortBy` — `newest` | `oldest` | `price-asc` | `price-desc`
- `page`, `limit` — pagination (default: page=1, limit=12, max limit=100)

## Frontend Page Status
| Page | Status | Notes |
|------|--------|-------|
| / (catalog) | ✅ Complete | Search, filter, sort, pagination, dummy data |
| /products/[id] | ✅ Complete | Detail, add-to-cart, suggestions |
| /cart | ✅ Complete | Quantities, totals, localStorage |
| /checkout | ✅ Complete | Address + mock payment + confirmation |
| /orders | ✅ Complete | Order history (dummy data) |
| /orders/[id] | ✅ Complete | Order detail |
| /auth/login | ✅ Complete | Real backend login + mock fallback |
| /auth/register | ✅ Complete | Mock registration |
| /admin | ✅ Complete | Dashboard, stats, chart |
| /admin/products | ✅ Complete | Calls real API, fallback to dummy, delete with confirmation |
| /admin/products/new | ✅ Complete | Calls real API, Cloudinary upload + URL fallback |
| /admin/products/[id]/edit | ✅ Complete | Loads from real API, Cloudinary upload + URL fallback |
| /admin/orders | ✅ Complete | All orders, status updates |

## Key Frontend Files
| File | Purpose |
|------|---------|
| `lib/api.ts` | Typed fetch client for all backend calls |
| `lib/dummy-data.ts` | Fallback data used when backend is unreachable |
| `context/AuthContext.tsx` | Real backend auth + mock fallback, JWT in sessionStorage |
| `components/ImageUpload.tsx` | Cloudinary drag-drop upload + URL tab |

## Credentials (Mock / Seed)
- **Admin**: admin@store.com / Admin123!
- **Customer**: customer@store.com / Customer123!

## Environment Variables

### Backend — copy `backend/.env.example` to `backend/.env`
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=ecommerce_db
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
```

### Frontend — copy `frontend/.env.local.example` to `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```
Without Cloudinary vars, image field falls back to URL text input — app still works.

## Running the Project
```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev

# Seed DB (after backend is running)
cd backend && npm run seed
```

## Commit History
- `design and auth` — initial UI/UX structure + auth module
- `admin panel and product module integration` — full Products CRUD API, admin panel wired to real API, Cloudinary image upload

## Next Steps for Future Claude Sessions
1. **Wire storefront to real Products API** — replace `lib/dummy-data.ts` imports in catalog and product detail pages with `fetchProducts()` / `fetchProduct()` from `lib/api.ts`
2. **Implement Cart module** — `GET/POST/PUT/DELETE /cart` scoped to logged-in user; replace localStorage cart with server-side persistence
3. **Implement Orders module** — `POST /orders` (checkout flow, stock decrement), `GET /orders` (user's own orders), `PUT /orders/:id/status` (admin only)
4. **Wire checkout to real Orders API** — the checkout page currently only clears localStorage cart; it should POST to `/orders`
5. **Wire order history** — replace ORDERS dummy data with real `GET /orders` call (requires JWT)
6. **Admin dashboard stats** — wire to real `/products/stats` + orders stats once orders module is done
7. **Wire auth register** — `/auth/register` page currently mocks registration; wire to `registerUser()` in `lib/api.ts`
8. **Unit tests** — add `products.service.spec.ts` covering create/update/delete with stock validation
9. **Deploy** — Dockerize backend + DB, deploy frontend to Vercel

## Open-Ended Feature: Product Suggestions
**Interpretation**: Same-category products = relevant (intent signal from current view).
**Backend**: `GET /products/:id/suggestions` — finds product, queries same category, excludes current, returns up to 4.
**Frontend**: Product detail page shows "You might also like" section.
**Future**: Weight by purchase co-occurrence (collaborative filtering), or by user's own purchase history.

## Agent Workflow Notes
- Frontend built by: frontend agent (Claude sub-agent) + direct edits in main session
- Backend built by: backend agent (Claude sub-agent) + direct edits in main session
- Agent prompts stored in: `agents/frontend-agent.md` and `agents/backend-agent.md`
- CLAUDE.md updated each session — always read this file first

## Known Issues / Watch Out For
- `next.config.mjs` must use JSDoc types (`/** @type */`), NOT TypeScript `import type` syntax
- TypeORM `synchronize: true` is fine for dev, must be `false` in production
- bcrypt rounds = 12 — intentional security vs. speed tradeoff
- Cart context uses sessionStorage for auth token (logged out on tab close — acceptable for assessment)
- `token.startsWith('mock_')` check in admin pages determines whether to hit real API or simulate
- Products API returns `price` as a string from PostgreSQL decimal column — use `Number(product.price)` in frontend when doing math or formatting
- `ParseUUIDPipe` on controller params means the test IDs from dummy data (e.g. `prod-1`) will fail validation — expected when backend is running
