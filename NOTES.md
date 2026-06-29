# NOTES.md — Assessment Notes

## Agent Workflow

### Tools Used
- **Claude Cowork (claude-sonnet-4-6)** — primary orchestration agent
- **Claude sub-agents** — two parallel agents: one for frontend, one for backend
- **Agent prompt files** stored in `agents/frontend-agent.md` and `agents/backend-agent.md`

### How I Drove the Agents

1. **Read the full spec first** — extracted all requirements before writing any code
2. **Planned the data model** — TypeScript interfaces (`lib/types.ts`) defined before any pages
3. **Created base files first** — dummy data, contexts, hooks before pages that depend on them
4. **Parallel execution** — frontend and backend agents ran simultaneously, with clear scoped briefs:
   - Frontend agent: all UI pages, components, context; dummy data only
   - Backend agent: NestJS scaffolding, auth module fully implemented, stubs for future modules
5. **`CLAUDE.md` as handoff** — each future Claude session will read this file first to understand the project state, what's done, and what comes next
6. **Verified output** — read back key files (main.ts, auth.service.ts, app/page.tsx) to confirm correctness before committing

### Where the Agent Helped
- Generated all boilerplate (NestJS decorators, TypeORM entities, passport strategies) quickly
- Wrote consistent TypeScript without type errors across 40+ files
- Correctly implemented the 3-step checkout wizard with localStorage cart clear on confirmation
- Set up CORS, global ValidationPipe, and Swagger in main.ts correctly first try

### Where the Agent Struggled / Needed Correction
- Initial `next.config.mjs` used TypeScript `import type` syntax inside a `.mjs` file — invalid. Fixed by converting to JSDoc comment style: `/** @type {import('next').NextConfig} */`
- Sub-agents initially wrote to their own sandbox paths, not the user's workspace. Fixed by reconfirming the exact absolute Windows paths in the prompt.
- First agent attempt used `isolation: "worktree"` which failed (no git repo configured for worktrees). Fixed by removing that parameter.

### Supervision & Verification
- Read back 6+ generated files to verify: `main.ts`, `auth.service.ts`, `app.module.ts`, `seed.ts`, `app/page.tsx`, `app/layout.tsx`
- Confirmed bcrypt is used (not plaintext passwords)
- Confirmed JWT secret comes from ConfigService (not hardcoded)
- Confirmed password field is excluded from all API responses
- Confirmed `next.config.mjs` uses JSDoc (not TypeScript syntax)
- Confirmed stub modules return 501 with a proper response shape

### Design Workflow
- Design direction: clean, modern storefront (Shopify-style) + dashboard-style admin panel
- Color system: indigo-600 primary, white cards with gray-100 borders, gray-50 backgrounds
- Layout decision: Navbar + Footer for storefront; AdminSidebar + main for admin
- Component architecture: all reusable (ProductCard, CartItem, Pagination, StatsCard, Modal, EmptyState)
- SVG bar chart on admin dashboard (no external chart library needed — keeps bundle lean)

---

## Assumptions & Decisions

### Product Images — Cloudinary Unsigned Upload
**Decision**: Cloudinary free tier, unsigned upload directly from the browser.
**How it works**: The admin selects a file → browser POSTs directly to Cloudinary's API → gets back a `secure_url` → that URL is sent to the backend when saving the product. The backend never touches the file — it only stores the URL string in PostgreSQL.
**Why unsigned**: Unsigned presets are designed to be public. No secret is exposed. The `upload_preset` name is intentionally public. Signed uploads would require a backend proxy (to protect the API key), adding unnecessary complexity.
**Fallback**: If `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` are not set in `.env.local`, the image field renders as a plain URL text input. The app is fully functional without Cloudinary — useful for development without setup.
**Future**: Could switch to signed uploads (backend generates signature) without changing the stored URL format.

### Payment
Used a mock Stripe-style card form in test mode. No real payment SDK. The UI shows "4242 4242 4242 4242" as the test card number. Reason: assessment explicitly permits mocked payment.

### Cart Persistence
Cart stored in localStorage (client-side). This means it doesn't sync across devices. Acceptable for assessment scope — the backend CartItem entity is ready for a real server-side cart when the cart module is implemented.

### Auth Persistence
Frontend auth context doesn't persist to localStorage (user is logged out on refresh). This is intentional for the mock phase — once real JWT flow is wired, the token will be stored and the `/auth/me` endpoint will restore session.

### Admin Access Control
Frontend: checks `user?.role === 'admin'` in the admin layout, redirects to login if not.
Backend: `RolesGuard` + `@Roles('admin')` decorator pattern ready for all admin endpoints.

### Open-Ended Feature: Product Suggestions
**Interpretation**: "Relevant to the customer" = products in the same category the customer is currently viewing.
**Implementation**: On `/products/[id]`, a "You might also like" section filters PRODUCTS by matching category, excludes the current product, limits to 4 results.
**Reasoning**: Category is a strong signal for intent — if someone is looking at a laptop, showing other electronics is more useful than random products. This is the simplest interpretable and verifiable approach that provides real value.
**Future enhancement**: With purchase history, weight suggestions by co-purchase frequency (collaborative filtering). With browsing history, weight by recency and repeat views.

---

## Trade-offs & Scope

### Built Fully
- Complete frontend UI/UX: all 14 pages, 14 components, full dummy data with real API fallback
- Backend auth module: register, login, JWT, guards, decorators, strategies
- Backend Products module: full CRUD, paginated query builder, suggestions endpoint, admin guards
- Backend entity schema: User, Product, Order, OrderItem, CartItem (ready for future modules)
- `lib/api.ts` typed fetch client — all backend calls centralised, token-aware
- `components/ImageUpload.tsx` — Cloudinary drag-drop upload with URL fallback
- `context/AuthContext.tsx` — real backend login with mock fallback, JWT in sessionStorage
- Seed script (idempotent, standalone)
- E2E tests for auth (9 test cases)
- CLAUDE.md updated every session as handoff document

### Mocked / Simplified
- Storefront (catalog, product detail) still uses dummy data — backend Products API is ready but frontend hasn't been re-wired yet (next step)
- Payment is a UI mock — no real Stripe SDK
- Cart in localStorage only — server-side cart entity is ready but endpoint not implemented
- Auth register page still mocks registration (backend register endpoint exists, frontend not wired)
- Orders fully mocked — Orders module stub exists, entity ready

### What I'd Do With More Time
1. Wire storefront catalog to real Products API (`fetchProducts` in `lib/api.ts`)
2. Implement Cart module (server-side, user-scoped)
3. Implement Orders module (checkout creates order, decrements stock atomically, status lifecycle)
4. Wire order history and checkout to real API
5. Unit tests for ProductsService (stock decrement edge cases)
6. Dockerize: `docker-compose.yml` with postgres + backend + frontend
7. Deploy frontend to Vercel, backend to Railway or Render
