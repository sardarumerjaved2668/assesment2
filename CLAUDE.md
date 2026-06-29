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
- **Image URLs**: products use URL strings (not file uploads) — simpler, documented in NOTES.md
- **Mock payment**: Stripe test-mode UI mocked in frontend; no real payment SDK integrated
- **Product suggestions**: Category-based "You might also like" on product detail pages
- **Admin access**: Role-based guard on backend; frontend redirects non-admin users

## Backend Module Status
| Module | Status | Notes |
|--------|--------|-------|
| Auth | ✅ Complete | Register, Login, JWT, Guards, Decorators |
| Users | ✅ Complete | Entity, Service, Module |
| Products | 🔲 Stub | Entity done, controller returns 501 |
| Orders | 🔲 Stub | Entity done, controller returns 501 |
| Cart | 🔲 Stub | Entity done, controller returns 501 |
| Seed Script | ✅ Complete | admin@store.com / Admin123!, customer@store.com / Customer123! |

## Frontend Page Status
| Page | Status | Notes |
|------|--------|-------|
| / (catalog) | ✅ Complete | Search, filter, sort, pagination, dummy data |
| /products/[id] | ✅ Complete | Detail, add-to-cart, suggestions |
| /cart | ✅ Complete | Quantities, totals, localStorage |
| /checkout | ✅ Complete | Address + mock payment + confirmation |
| /orders | ✅ Complete | Order history (dummy data) |
| /orders/[id] | ✅ Complete | Order detail |
| /auth/login | ✅ Complete | Mock auth, redirects |
| /auth/register | ✅ Complete | Mock registration |
| /admin | ✅ Complete | Dashboard, stats, chart |
| /admin/products | ✅ Complete | CRUD list with modals |
| /admin/products/new | ✅ Complete | Create form |
| /admin/products/[id]/edit | ✅ Complete | Edit form |
| /admin/orders | ✅ Complete | All orders, status updates |

## Credentials (Mock / Seed)
- **Admin**: admin@store.com / Admin123!
- **Customer**: customer@store.com / Customer123!

## Environment Variables
Copy backend/.env.example to backend/.env and fill in:
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

## Running the Project
```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev

# Seed DB (after backend is running with DB connected)
cd backend && npx ts-node src/seed/seed.ts
```

## Commit Convention Used
- `design and auth` — initial UI/UX + auth module
- Future: `feat: products module`, `feat: cart module`, `feat: orders module`

## Next Steps for Future Claude Sessions
1. Implement Products module (CRUD endpoints with image URL, stock validation)
2. Implement Cart module (add/remove/update, user-scoped)
3. Implement Orders module (checkout flow, status lifecycle, stock decrement)
4. Wire frontend API calls (replace dummy data with real fetch calls to localhost:3001)
5. Add admin endpoints for order status updates and product management
6. Write unit tests for auth service and orders service
7. Add input validation error display on frontend forms
8. Deploy: Dockerize backend + DB, deploy frontend to Vercel

## Open-Ended Feature: Product Suggestions
**Interpretation**: "Relevant" = same category products the user hasn't already added to cart.
**Implementation**: On /products/[id], a "You might also like" section filters PRODUCTS by matching category, excludes the current product, limits to 4 results.
**Future enhancement**: Track view/purchase history per user and weight by frequency.

## Agent Workflow Notes
- Frontend built by: frontend agent (Claude sub-agent)
- Backend built by: backend agent (Claude sub-agent)  
- Agent prompts stored in: agents/frontend-agent.md and agents/backend-agent.md
- CLAUDE.md is the handoff document for future sessions

## Known Issues / Watch Out For
- `next.config.mjs` must use JSDoc types, NOT TypeScript `import type` syntax
- TypeORM `synchronize: true` is fine for dev, must be false in production
- bcrypt rounds set to 12 — this is intentional (security vs. speed tradeoff)
- Cart context uses localStorage — won't sync across devices (acceptable for assessment scope)
