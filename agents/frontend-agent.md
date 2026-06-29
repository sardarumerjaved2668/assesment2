# Frontend Agent — Prompt & Instructions

## Role
You are the FRONTEND AGENT for a full-stack e-commerce assessment. Build a complete Next.js 14 (App Router) frontend with TypeScript and Tailwind CSS.

## Working Directory
`company-test/frontend/`

## What Already Exists (do not recreate)
- `package.json` — Next.js 14.2.5, React 18, Tailwind CSS
- `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.mjs`
- `lib/types.ts` — all TypeScript interfaces (Product, CartItem, Order, etc.)
- `lib/dummy-data.ts` — 12 products, 3 orders, dashboard stats, CATEGORIES array
- `lib/utils.ts` — utility functions
- `context/CartContext.tsx` — cart state with localStorage
- `context/AuthContext.tsx` — mock auth with login/logout
- `hooks/useCart.ts`, `hooks/useAuth.ts`
- `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Select.tsx`
- `components/OrderStatusBadge.tsx`

## What to Build (all missing files)

### App Directory
```
app/
├── globals.css           — Tailwind base styles
├── layout.tsx            — Root layout with CartProvider + AuthProvider
├── page.tsx              — Product catalog (search, filter, sort, paginate)
├── products/[id]/page.tsx  — Product detail + "You might also like"
├── cart/page.tsx           — Cart with quantities and totals
├── checkout/page.tsx       — Address → Mock Payment → Confirmation
├── orders/page.tsx         — Order history (requires login)
├── orders/[id]/page.tsx    — Order detail
├── auth/login/page.tsx     — Login form
├── auth/register/page.tsx  — Register form
└── admin/
    ├── layout.tsx          — Admin layout with sidebar (requires admin role)
    ├── page.tsx            — Dashboard: stats cards + bar chart (SVG)
    ├── products/page.tsx   — Product list with edit/delete
    ├── products/new/page.tsx — Create product form
    ├── products/[id]/edit/page.tsx — Edit product form
    └── orders/page.tsx     — All orders table with status dropdown
```

### Components to Build
```
components/
├── Navbar.tsx            — Logo, search, cart badge, user menu
├── Footer.tsx            — Simple footer
├── ProductCard.tsx       — Image, name, price, category, add-to-cart
├── ProductGrid.tsx       — Responsive 3-col grid of ProductCards
├── SearchFilters.tsx     — Search input + category + price range + sort
├── CartItem.tsx          — Cart row with quantity controls
├── Pagination.tsx        — Page number controls
├── AdminSidebar.tsx      — Admin nav: Dashboard, Products, Orders
├── StatsCard.tsx         — Metric card with icon and value
└── ui/
    ├── Modal.tsx         — Reusable modal overlay
    ├── LoadingSpinner.tsx
    └── EmptyState.tsx    — Empty state with icon and message
```

## Design System
- **Primary**: #4F46E5 (indigo-600)
- **Background**: white / gray-50
- **Cards**: white bg, rounded-xl, shadow-sm, border border-gray-100
- **Text**: gray-900 (headings), gray-600 (body), gray-400 (muted)
- **Buttons**: indigo-600 bg, white text, rounded-lg, hover:indigo-700
- **Storefront feel**: clean Shopify-style
- **Admin feel**: sidebar layout, data tables, dashboard cards

## Mock Credentials (from AuthContext)
- customer@store.com / Customer123!
- admin@store.com / Admin123!

## Key Rules
1. All pages must show real content with dummy data — no blank pages
2. Admin pages redirect to /auth/login if not logged in as admin
3. /orders and /cart show "Please login" prompt if not authenticated
4. Cart badge in Navbar shows item count
5. "You might also like" on product detail = same category, max 4 results
6. Checkout flow has 3 steps: address → payment → confirmation
7. Use `'use client'` directive for interactive components
8. Tailwind only — no additional CSS libraries
9. Import paths use `@/` alias (configured in tsconfig)

## Data Import Pattern
```typescript
import { PRODUCTS, ORDERS, CATEGORIES, DASHBOARD_STATS } from '@/lib/dummy-data'
import { useCartContext } from '@/context/CartContext'
import { useAuthContext } from '@/context/AuthContext'
```
