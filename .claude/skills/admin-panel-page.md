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
- `app/admin/layout.tsx` — sidebar and nav links
- `app/admin/products/page.tsx` — list/table page reference
- `app/admin/orders/page.tsx` — page with status filtering reference

---

## Step 2 — Admin layout rules

No `<Navbar>` or `<Footer>`. Just return the content div:

```tsx
return <div className="p-6 lg:p-8">{/* content */}</div>;
```

---

## Step 3 — Add nav link to sidebar

Add to the links array in `app/admin/layout.tsx`:
```tsx
{ href: '/admin/new-section', label: 'New Section', icon: <YourSvgIcon /> }
```

---

## Step 4 — Auth guard (required on ALL admin pages)

```tsx
const { user, token, isLoading } = useAuthContext();
useEffect(() => {
  if (!isLoading && (!user || user.role !== 'admin')) router.push('/auth/login');
}, [user, isLoading, router]);
if (isLoading || !user) return null;
```

---

## Step 5 — Standard list/table structure

```tsx
<div className="p-6 lg:p-8 space-y-6">
  <div className="flex items-center justify-between">
    <div><h1 className="text-2xl font-bold text-gray-900">Title</h1></div>
    <button onClick={() => router.push('/admin/section/new')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Add New</button>
  </div>
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-100">
        <tr><th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {items.map(item => (
          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">{item.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## Step 6 — Delete confirmation modal (always confirm before delete)

```tsx
{deleteTarget && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item</h3>
      <p className="text-sm text-gray-500 mb-6">Are you sure? This cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm">Cancel</button>
        <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Checklist
- Auth guard with `isLoading` + role check
- Nav link added to sidebar in `layout.tsx`
- Delete confirmation modal (never delete without confirm)
- Loading and empty states handled
- No `<Navbar>` or `<Footer>`
- Design system tokens used
