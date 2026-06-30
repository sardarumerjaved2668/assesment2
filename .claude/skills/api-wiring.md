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
1. `frontend/lib/api.ts` — existing fetch functions and patterns
2. The target page — current dummy-data usage

---

## Step 2 — Add the fetch function to lib/api.ts

All backend calls go in `lib/api.ts`. Never put fetch calls inline in page components.

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// GET
export async function fetchItems(token: string): Promise<Item[]> {
  const res = await fetch(`${API_URL}/items`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed'); }
  return res.json();
}

// POST
export async function createItem(dto: CreateItemDto, token: string): Promise<Item> {
  const res = await fetch(`${API_URL}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(dto) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed'); }
  return res.json();
}

// DELETE
export async function deleteItem(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed'); }
}
```

---

## Step 3 — Update the page

```tsx
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!token) { setLoading(false); return; }
  if (token.startsWith('mock_')) { setItems(DUMMY_ITEMS); setLoading(false); return; }
  fetchItems(token).then(setItems).catch((err) => { setError(err.message); setItems(DUMMY_ITEMS); }).finally(() => setLoading(false));
}, [token]);
```

---

## Step 4 — Mock token guard (critical)

Every real API call must be guarded:
```tsx
if (token.startsWith('mock_')) { /* use dummy data */ return; }
// safe to call real API
```

---

## Checklist
- Fetch functions in `lib/api.ts` (not inline)
- `token.startsWith('mock_')` guard in place
- Dummy-data fallback on error
- Loading spinner shown while fetching
- Error message shown (non-breaking)
- New types in `lib/types.ts`
