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

Before writing anything, read the closest existing page to understand the pattern:

| New page type | Read this reference |
|---|---|
| Storefront listing | `app/page.tsx` |
| Storefront detail | `app/products/[id]/page.tsx` |
| Auth-gated user page | `app/orders/page.tsx` |
| Admin panel page | `app/admin/products/page.tsx` |
| Admin with form | `app/admin/products/new/page.tsx` |

Also read `lib/api.ts` and `lib/dummy-data.ts` to understand available data.

---

## Step 2 — Decide: server or client component

Use `'use client'` when the page needs:
- `useState` / `useEffect`
- Event handlers (onClick, onSubmit)
- Auth context (`useAuthContext`)
- Cart context (`useCartContext`)

Leave it as a server component (no directive) when it only fetches data at build/request time with no interactivity.

Most pages in this project are client components.

---

## Step 3 — Auth gating

For pages that require login, check auth at the top of the component:

```tsx
const { user, token, isLoading } = useAuthContext();

// Prevent premature redirect during session restore
if (isLoading) return null;
if (!user) {
  router.push('/auth/login');
  return null;
}
```

For admin-only pages, also check role:

```tsx
if (user.role !== 'admin') {
  router.push('/auth/login');
  return null;
}
```

---

## Step 4 — Data fetching pattern

Always provide a dummy-data fallback so the page works without a running backend.

```tsx
const [data, setData] = useState(DUMMY_FALLBACK);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!token || token.startsWith('mock_')) {
    setLoading(false);
    return; // dummy data stays
  }
  fetchFromApi(token)
    .then(setData)
    .catch(() => setError('Failed to load. Showing sample data.'))
    .finally(() => setLoading(false));
}, [token]);
```

---

## Step 5 — Layout structure

### Storefront page

```tsx
return (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* page content */}
      </div>
    </main>
    <Footer />
  </div>
);
```

### Admin panel page (inside `app/admin/` — uses the admin layout)

```tsx
return (
  <div className="p-6 lg:p-8">
    {/* page content — no Navbar/Footer, admin layout.tsx handles the sidebar */}
  </div>
);
```

---

## Step 6 — Design system tokens (use these, don't invent new ones)

```
Cards:           bg-white rounded-2xl shadow-sm border border-gray-100
Primary button:  bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700
Secondary button: border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50
Inputs:          border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500
Gradient button: bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl
Page bg:         bg-gray-50
Page title:      text-2xl sm:text-3xl font-bold text-gray-900
Section label:   text-xs font-semibold uppercase tracking-widest text-gray-400
Body text:       text-sm text-gray-600 leading-relaxed
Success:         emerald-600    Warning: amber-500    Error: red-600
```

---

## Step 7 — Loading and error states

Every data-fetching page must handle all three states:

```tsx
if (loading) return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

{error && (
  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
    {error}
  </div>
)}

{data.length === 0 && (
  <div className="text-center py-16">
    <p className="text-gray-400 text-sm">No items found.</p>
  </div>
)}
```

---

## Step 8 — File placement

| Route | File path |
|---|---|
| `/new-page` | `app/new-page/page.tsx` |
| `/products/reviews` | `app/products/reviews/page.tsx` |
| `/admin/reports` | `app/admin/reports/page.tsx` |
| `/admin/users/[id]` | `app/admin/users/[id]/page.tsx` |

---

## Step 9 — Final checklist

- `'use client'` present if any hooks or event handlers are used
- Auth guard added if page requires login
- Dummy-data fallback present
- Loading spinner and error message handled
- Design system tokens used (no custom hex colours)
- New API calls added to `lib/api.ts`, not inline in the component
- Storefront pages import `Navbar` and `Footer`
- Admin pages do NOT import `Navbar`/`Footer` (the admin layout handles it)
