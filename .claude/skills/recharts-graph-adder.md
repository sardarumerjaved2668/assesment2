---
name: recharts-graph-adder
description: >
  Add Recharts charts and graphs to any Next.js page. Use this skill whenever
  the user wants to add, replace, or improve a chart or graph — bar chart,
  line chart, area chart, pie chart, donut chart, or horizontal bar chart.
  Also triggers on "add a graph", "show this data as a chart", "replace the SVG
  chart", "visualize this", or "make a dashboard with charts". Handles package
  installation, 'use client' requirements, ResponsiveContainer, custom
  tooltips, data shaping, and colour theming automatically.
---

# Recharts Graph Adder — ShopNext

## Step 1 — Install if needed
Check `frontend/package.json`. If `recharts` is missing:
```bash
cd frontend && npm install recharts
```
Restart the dev server after installing.

---

## Step 2 — Read the target file first
Understand: what data exists, where the chart fits in the layout.

---

## Step 3 — Chart type guide

| Use case | Chart |
|---|---|
| Compare values across categories | `BarChart` (vertical) |
| Ranked items (top products) | `BarChart` (horizontal, `layout="vertical"`) |
| Trend over time | `AreaChart` |
| Proportions / parts of a whole | `PieChart` with `innerRadius` (donut) |

---

## Step 4 — Always wrap in ResponsiveContainer

```tsx
<div style={{ width: '100%', height: 280 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>...</BarChart>
  </ResponsiveContainer>
</div>
```

The file **must** have `'use client'` — Recharts uses browser APIs.

---

## Step 5 — Shape data before JSX (not inline)

```tsx
const chartData = stats.ordersByStatus.map(([status, count]) => ({ label: status, value: count }));
```

---

## Step 6 — Standard patterns

### Vertical BarChart
```tsx
<BarChart data={chartData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6' }} />
  <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
</BarChart>
```

### Donut PieChart
```tsx
<PieChart>
  <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
    {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
  </Pie>
  <Tooltip contentStyle={{ borderRadius: '12px' }} />
  <Legend iconType="circle" iconSize={10} />
</PieChart>
```

### AreaChart
```tsx
<AreaChart data={chartData}>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill="url(#grad)" />
</AreaChart>
```

---

## Step 7 — Colour palette
```tsx
const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6'];
const STATUS_COLORS = { pending: '#F59E0B', processing: '#6366F1', shipped: '#8B5CF6', delivered: '#10B981', cancelled: '#EF4444' };
```

---

## Step 8 — Wrap in card
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  <h2 className="text-base font-semibold text-gray-900 mb-6">Chart Title</h2>
  {/* chart */}
</div>
```

---

## Common mistakes
- Forgetting `'use client'`
- No empty state when `data.length === 0`
- Running `npm install recharts` in project root instead of `frontend/`
