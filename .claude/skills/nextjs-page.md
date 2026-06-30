---
name: nextjs-page
description: >
  Create a new Next.js 14 App Router page for the ShopNext storefront or admin
  panel. Use this skill whenever the user wants to add a new page, route, or
  screen to the frontend. Triggers on phrases like "add a new page", "create a
  page for X", "I need a screen that shows Y", "add a route for Z", or "build
  the UI for X". Handles 'use client' vs server component decisions, auth
  guards, dummy-data fallback, Navbar/Footer layout, design system tokens, and
  API wiring patterns automatically.
---

# Next.js Page Creator — ShopNext Frontend

You are adding a new page to the ShopNext Next.js 14 App Router frontend (`company-test/frontend/`).

## Step 1 — Read reference pages first

| New page type | Read this reference |
|---|---|
| Storefront listing | `app/page.tsx` |
| Storefront detail | `app/products/[id]/page.tsx` |
| Auth-gated user page | `app/orders/page.tsx` |
| Admin panel page | `app/admin/products/page.tsx` |
| Admin with form | `app/admin/products/new/page.tsx` |

Also read `lib/api.ts` and `lib/dummy-data.ts`.

---

## Step 2 — `'use client'` if needed

Required when the page uses: `useState`, `useEffect`, event handlers, `useAuthContext`, `useCartContext`.

---

## Step 3 — Auth gating

```tsx
const { user, token, isLoading } = useAuthContext();
if (isLoading) return null;
if (!user) { router.push('/auth/login'); return null; }
// Admin only:
if (user.role !== 'admin') { router.push('/auth/login'); return null; }
```

---

## Step 4 — Data fetching pattern

```tsx
const [data, setData] = useState(DUMMY_FALLBACK);
const [loading, setLoading] = useState(true);
useEffect(() => {
  if (!token || token.startsWith('mock_')) { setLoading(false); return; }
  fetchFromApi(token).then(setData).catch(() => setError('Failed to load. Showing sample data.')).finally(() => setLoading(false));
}, [token]);
```

---

## Step 5 — Layout structure

```tsx
// Storefront
<div className="min-h-screen flex flex-col bg-gray-50">
  <Navbar />
  <main className="flex-1"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{/* content */}</div></main>
  <Footer />
</div>

// Admin (no Navbar/Footer)
<div className="p-6 lg:p-8">{/* content */}</div>
```

---

## Step 6 — Design system tokens

```
Cards:           bg-white rounded-2xl shadow-sm border border-gray-100
Primary button:  bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700
Secondary button: border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50
Inputs:          border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500
Gradient button: bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl
```

---

## Step 7 — Loading / empty / error states (all three required)

```tsx
if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
{error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
{data.length === 0 && <div className="text-center py-16"><p className="text-gray-400 text-sm">No items found.</p></div>}
```

---

## Checklist
- `'use client'` if hooks/handlers used
- Auth guard if login required
- Dummy-data fallback present
- Loading + error + empty states handled
- Design tokens used (no custom hex)
- New API calls in `lib/api.ts`, not inline
- Storefront: `Navbar` + `Footer` imported
- Admin: no `Navbar`/`Footer`
