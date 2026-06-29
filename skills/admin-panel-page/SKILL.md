---
name: admin-panel-page
description: >
  Create a new admin panel page for the ShopNext e-commerce platform. Use this
  skill whenever the user wants to add a new section to the admin panel — a
  management page, a report, a settings screen, or any admin-only view. Triggers
  on phrases like "add an admin page", "create an admin section for X", "I need
  to manage X in the admin", "add a CRUD page for X", "build the admin view for
  Y", or "add X to the admin panel". Handles the admin layout, sidebar
  navigation link, data table with actions, confirmation modals, and status
  badges — all following the admin design system.
---

# Admin Panel Page Creator — ShopNext

You are adding a new page to the admin panel (`company-test/frontend/app/admin/`).

## Step 1 — Read the admin layout and a reference page

Before writing, read:
- `app/admin/layout.tsx` — understand the sidebar and nav links
- `app/admin/products/page.tsx` — reference for a list/table page
- `app/admin/orders/page.tsx` — reference for a page with status filtering

---

## Step 2 — Admin layout rules

Admin pages live inside `app/admin/` and are automatically wrapped by `app/admin/layout.tsx`, which provides:
- Fixed left sidebar (`w-64 bg-slate-900`)
- Sticky top header with breadcrumb
- Content area (`ml-64 bg-gray-50`)

**Do NOT add `<Navbar>` or `<Footer>` to admin pages.** Just return the content div directly:

```tsx
return (
  <div className="p-6 lg:p-8">
    {/* content */}
  </div>
);
```

---

## Step 3 — Add the nav link to the sidebar

Read `app/admin/layout.tsx` and add a new nav item to the sidebar links array:

```tsx
{ href: '/admin/new-section', label: 'New Section', icon: <YourIcon /> }
```

Match the existing icon style (24×24 SVG, `stroke="currentColor"`, `strokeWidth={2}`).

---

## Step 4 — Auth guard (required on all admin pages)

```tsx
'use client';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const { user, token, isLoading } = useAuthContext();
const router = useRouter();

useEffect(() => {
  if (!isLoading && (!user || user.role !== 'admin')) {
    router.push('/auth/login');
  }
}, [user, isLoading, router]);

if (isLoading || !user) return null;
```

---

## Step 5 — Standard list/table page structure

```tsx
return (
  <div className="p-6 lg:p-8 space-y-6">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Section Title</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your items</p>
      </div>
      <button
        onClick={() => router.push('/admin/section/new')}
        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add New
      </button>
    </div>

    {/* Search / filter bar */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>

    {/* Data table */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Column</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => router.push(`/admin/section/${item.id}/edit`)}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">No items found.</p>
        </div>
      )}
    </div>
  </div>
);
```

---

## Step 6 — Delete confirmation modal

Always confirm before deleting. Use this modal pattern:

```tsx
{deleteTarget && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item</h3>
      <p className="text-sm text-gray-500 mb-6">
        Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setDeleteTarget(null)}
          className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Step 7 — Status badges

Use the `OrderStatusBadge` component for order statuses. For custom statuses:

```tsx
const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
};

<span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
  {item.status}
</span>
```

---

## Step 8 — Wire to the API

Follow the `api-wiring` skill pattern:
- Add fetch functions to `lib/api.ts`
- Guard mock tokens with `token.startsWith('mock_')`
- Keep a dummy-data fallback

---

## Checklist

- Auth guard present (`isLoading` + role check)
- Nav link added to sidebar in `layout.tsx`
- Delete confirmation modal used (never delete without confirm)
- Loading and empty states handled
- No `<Navbar>` or `<Footer>` in the admin page
- Design system tokens used throughout
