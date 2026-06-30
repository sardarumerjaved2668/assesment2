# NOTES.md — Assessment Notes

## Agent Workflow

### Tools Used
- **Claude Cowork (claude-sonnet-4-6)** — primary orchestration agent across all sessions
- **Claude sub-agents** — spawned in parallel for frontend and backend tasks
- **Agent prompt files** stored in `agents/frontend-agent.md` and `agents/backend-agent.md`
- **`CLAUDE.md`** maintained throughout as the live project-context handoff document

### How I Drove the Agents

1. **Read the full spec first** — extracted all requirements before writing any code
2. **Planned the data model and endpoints** — TypeScript interfaces and entity shapes defined before pages
3. **Created base files first** — entities, DTOs, contexts, dummy data before modules that depend on them
4. **Parallel execution** — frontend and backend agents ran simultaneously with clear scoped briefs:
   - Frontend agent: all UI pages, components, contexts; dummy fallback data
   - Backend agent: NestJS scaffolding, auth, products, cart, orders, uploads modules
5. **`CLAUDE.md` as the handoff document** — updated after every session so a new agent immediately understands the current state, what is done, and what comes next
6. **Verified output every session** — read back key generated files to confirm correctness before committing

### Where the Agent Helped
- Generated all NestJS boilerplate (decorators, TypeORM entities, passport strategies) quickly and correctly
- Wrote consistent, typed TypeScript across 50+ files without type errors
- Implemented the 3-step checkout wizard correctly first try
- Set up CORS, global `ValidationPipe`, and Swagger in `main.ts` correctly
- Correctly structured MongoDB TypeORM entities using `@ObjectIdColumn` and `MongoRepository`

### Where the Agent Struggled / Needed Correction
- **`next.config.mjs` syntax error** — initial version used `import type` inside a `.mjs` file, which is invalid. Fixed by converting to JSDoc: `/** @type {import('next').NextConfig} */`
- **Sub-agent sandbox paths** — sub-agents initially wrote files to their own sandbox paths, not the user's workspace. Fixed by including exact absolute Windows paths in every prompt
- **`isolation: "worktree"` failure** — early agent calls used this parameter; it failed because the worktree wasn't configured. Removed the parameter going forward
- **Image storage approach** — first iteration wired Cloudinary. Replaced with Multer backend upload (`POST /uploads/image`) to eliminate the third-party dependency and keep the setup self-contained
- **Stale README/NOTES** — documentation lagged the implementation across sessions; corrected by re-reading both files and rewriting them to match the actual current state

### Supervision & Verification
- Read back 10+ generated files each session: `main.ts`, `auth.service.ts`, `app.module.ts`, `seed.ts`, `orders.service.ts`, `cart.service.ts`, `products.service.ts`, `app/page.tsx`, `context/AuthContext.tsx`, `lib/api.ts`
- Confirmed bcrypt is used (not plaintext passwords), password field excluded from all API responses
- Confirmed JWT secret comes from `ConfigService` (not hardcoded)
- Confirmed stock is decremented atomically at checkout before the order is saved
- Confirmed admin guards (`JwtAuthGuard + RolesGuard + @Roles('admin')`) are on all write endpoints
- Confirmed `CLAUDE.md` was accurate before ending each session

---

## Assumptions & Decisions

### Product Images — Backend Multer Upload
**Decision**: Images are uploaded to the backend via `POST /uploads/image` (Multer disk storage → `backend/uploads/`). The endpoint returns a public URL (`http://<host>/uploads/<filename>`); only that URL is stored in MongoDB.
**Why**: Keeps the setup entirely self-contained — no third-party accounts or API keys required. The admin form also accepts a plain image URL as an alternative.
**Trade-off**: Uploaded images live on the server's filesystem; in production you'd swap Multer's disk storage for an S3/Cloudinary storage adapter without changing the rest of the code.

### Payment
Mock-only. `POST /orders/checkout` calls `processMockPayment` which accepts card `4242 4242 4242 4242` (success) and `4000 0000 0000 0002` (decline). No real Stripe SDK. The assessment explicitly permits mocked payment. Swap `processMockPayment` for `stripe.paymentIntents.create` in production.

### Cart Persistence
Cart is stored in MongoDB, scoped per user. A logged-in user's cart persists across sessions and devices. Guest cart falls back to localStorage (via `CartContext`) — acceptable scope for this assessment.

### Auth Session Restore
On mount, `AuthContext` starts with `isLoading=true`, reads sessionStorage, and — for real JWTs — calls `GET /auth/me` to validate and refresh user data. Expired/invalid tokens are cleared. Mock tokens (prefix `mock_`) are trusted without a network call. `isLoading` only flips to `false` after restore, so the admin layout never redirects prematurely on hard refresh.

### Open-Ended Feature: Product Suggestions
**Interpretation**: "Relevant to the customer" = products in the same category as the one currently being viewed.
**Implementation**: `GET /products/:id/suggestions` returns up to 4 products matching the same category, excluding the current product. The storefront `/products/[id]` page renders a "You might also like" section.
**Reasoning**: Category is a strong, low-noise intent signal. If a user is looking at a laptop, showing other electronics is more useful than random products. This is the simplest verifiable approach that provides real value without requiring purchase history or ML.
**Future enhancement**: With purchase history, weight by co-purchase frequency (collaborative filtering). With browsing history, weight by recency and repeat views.

### Admin Access Control
- **Backend**: `JwtAuthGuard + RolesGuard + @Roles('admin')` on all write endpoints. Unauthenticated → 401, wrong role → 403 with explicit `ForbiddenException`.
- **Frontend**: `app/admin/layout.tsx` checks `user?.role === 'admin'` after session restore (`isLoading=false`) and redirects non-admin users to `/auth/login`. Renders `null` during loading to prevent content flash.

---

## Trade-offs & Scope

### Built Fully
- Complete frontend: all 16 pages, full real-API wiring with dummy fallback, consistent design system
- Auth: register, login, JWT, `GET /auth/me`, session restore, mock fallback
- Products: full CRUD, paginated query (`search`, `category`, `priceMin/Max`, `sortBy`, `page/limit`), `GET /products/:id/suggestions`
- Cart: per-user DB persistence, stock validation, line totals
- Orders: cart-based checkout, mock payment, stock decrement, status lifecycle, `GET /orders/stats`
- Uploads: Multer disk storage, static file serving, 5 MB / image-only validation
- Seed script: idempotent, creates admin + customer + 10 products
- Admin dashboard: real stats API, Recharts (bar chart, donut chart, area chart), top products table
- Admin orders: real API, inline status updates, client-side status filter tabs
- Automated tests: unit tests for mock payment, checkout stock validation, cart service, product suggestions

### Mocked / Simplified
- Payment is a UI mock — no real Stripe SDK. Clearly documented; swap-in is one function
- `backend/uploads/` is local disk — in production swap Multer's `diskStorage` for an S3 storage adapter
- TypeORM `synchronize: true` — fine for dev, must be `false` in production with proper migrations

### What I'd Do With More Time
1. Stripe test-mode integration (replace `processMockPayment`)
2. Multer → S3/Cloudinary storage adapter for production image hosting
3. Deploy: frontend to Vercel, backend to Railway/Render
4. Rate limiting on auth endpoints, helmet.js for security headers
5. Pagination on admin orders page

---

## Design System

Applied consistently across all storefront and admin pages.

### Colors
| Role | Value |
|------|-------|
| Primary | indigo-600 (#4F46E5), hover indigo-700 |
| Secondary | violet-600 |
| Brand gradient | `bg-gradient-to-r from-violet-600 to-indigo-600` |
| Hero/dark | `bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950` |
| Admin sidebar | bg-slate-900, active bg-indigo-600 |
| Page bg | gray-50 |
| Cards | bg-white |
| Success | emerald-600 |
| Warning | amber-500 |
| Error | red-600 |

### Component Tokens
- **Cards:** `bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow`
- **Primary button:** `bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all`
- **Gradient button:** `bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl`
- **Secondary button:** `border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50`
- **Inputs:** `border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm`
- **Badges:** `px-2.5 py-0.5 rounded-full text-xs font-semibold` with status-matched colors

### Typography
- Hero: `text-5xl font-black tracking-tight` (mobile: `text-3xl`)
- Page title: `text-2xl sm:text-3xl font-bold text-gray-900`
- Section label: `text-xs font-semibold uppercase tracking-widest text-gray-400`
- Body: `text-sm text-gray-600 leading-relaxed`

### Key Design Decisions
- **Navbar:** Announcement bar (gradient) + white sticky bar + rounded-full search + gradient logo text
- **Footer:** Dark `bg-gray-900` 4-column grid (Brand / Shop / Account / Info)
- **ProductCard:** `aspect-square` image, hover scale + quick-add overlay, decorative star rating
- **Auth pages:** Split-screen — dark gradient left panel (brand + features) + white card right panel
- **Admin sidebar:** Fixed `w-64 bg-slate-900`, gradient logo icon, active links `bg-indigo-600 rounded-xl`, gradient user avatar
- **Admin layout:** Sticky top header with dynamic breadcrumb; content area `ml-64 bg-gray-50`
- **Admin orders:** Client-side status filter tabs (statusFilter state, filteredOrders derived)
- **OrderStatusBadge:** Colored dot + pill, each status has distinct bg/border/text color

---

## Known Issues / Watch Out For
- `next.config.mjs` must use JSDoc types (`/** @type */`), NOT `import type` syntax. Remote image hosts whitelisted under `images.domains` (includes `localhost`)
- TypeORM `synchronize: true` is fine for dev, must be `false` in production
- ObjectId is serialized to a hex string in JSON — frontend `Product.id` / `Order.id` are strings
- Auth token in sessionStorage (logged out on tab close — acceptable for assessment). Mock tokens start with `mock_`
- Backend must be **restarted** after code changes for new routes to load; confirm endpoints at `http://localhost:3001/api/docs`
- `backend/uploads/` holds uploaded images; only `.gitkeep` is tracked (binaries are git-ignored)

---

## Additional API Endpoints (Admin)
- `GET /products/stats` — Admin JWT — product stats for the dashboard
- `GET /orders/stats` — Admin JWT — dashboard analytics: totalSales, totalOrders, averageOrderValue, ordersByStatus, topProducts
