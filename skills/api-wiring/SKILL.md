---
name: api-wiring
description: >
  Wire a Next.js frontend page to the real ShopNext backend API, replacing
  dummy data with live fetch calls. Use this skill whenever the user wants to
  connect a page to the backend, replace mock/dummy data with real API calls,
  add a new endpoint to lib/api.ts, or make a page pull live data. Triggers on
  phrases like "wire this to the API", "connect to the backend", "replace dummy
  data", "add a fetch call", "make this use real data", or "add this endpoint
  to the API client". Follows the project's typed fetch pattern in lib/api.ts
  and always preserves the dummy-data fallback.
---

# API Wiring — ShopNext Frontend

You are wiring a frontend page to the real backend API. The project uses a typed fetch client at `frontend/lib/api.ts`.

## Step 1 — Read both files first

Always read before editing:
1. `frontend/lib/api.ts` — understand the existing fetch functions and patterns
2. The target page file — understand its current state/dummy-data usage

---

## Step 2 — Add the fetch function to lib/api.ts

All backend calls go in `lib/api.ts`. Never put fetch calls inline in page components.

### Standard pattern for a GET endpoint

```typescript
export async function fetchItems(token: string): Promise<Item[]> {
  const res = await fetch(`${API_URL}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch items');
  }
  return res.json();
}
```

### Standard pattern for a POST endpoint

```typescript
export async function createItem(dto: CreateItemDto, token: string): Promise<Item> {
  const res = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create item');
  }
  return res.json();
}
```

### Standard pattern for a PUT endpoint

```typescript
export async function updateItem(id: string, dto: Partial<CreateItemDto>, token: string): Promise<Item> {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update item');
  }
  return res.json();
}
```

### Standard pattern for a DELETE endpoint

```typescript
export async function deleteItem(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete item');
  }
}
```

---

## Step 3 — Update the page to call the API

Replace the dummy-data initialisation with a real fetch, keeping the dummy fallback:

```tsx
// Before
const [items, setItems] = useState(DUMMY_ITEMS);

// After
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!token) { setLoading(false); return; }

  // Mock token — use dummy data, no network call
  if (token.startsWith('mock_')) {
    setItems(DUMMY_ITEMS);
    setLoading(false);
    return;
  }

  // Real token — call the backend
  fetchItems(token)
    .then(setItems)
    .catch((err) => {
      setError(err.message || 'Failed to load. Showing sample data.');
      setItems(DUMMY_ITEMS); // fall back silently
    })
    .finally(() => setLoading(false));
}, [token]);
```

---

## Step 4 — Mock token guard (critical)

**Every** real API call must be guarded by `token.startsWith('mock_')`. This ensures the app stays functional in demo mode without a running backend.

```tsx
if (token.startsWith('mock_')) {
  // use dummy data — no fetch
  return;
}
// safe to call real API here
```

---

## Step 5 — Error handling in the UI

Show errors without breaking the page:

```tsx
{error && (
  <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
    {error}
  </div>
)}
```

---

## Step 6 — Base URL

The API base URL is always read from the environment variable:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

This is already set at the top of `lib/api.ts`. Never hardcode `localhost:3001` in a page component.

---

## Step 7 — TypeScript types

All API response types are defined in `lib/types.ts`. Check there before creating new interfaces. If a type is missing, add it to `lib/types.ts`, not inline in the page or in `lib/api.ts`.

---

## Checklist before finishing

- New fetch functions added to `lib/api.ts` (not inline in the page)
- `token.startsWith('mock_')` guard in place
- Dummy-data fallback still present for error cases
- Loading spinner shown while fetching
- Error message shown (non-breaking) if fetch fails
- New types added to `lib/types.ts` if needed
