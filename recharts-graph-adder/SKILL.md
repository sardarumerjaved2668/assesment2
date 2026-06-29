---
name: recharts-graph-adder
description: >
  Add Recharts charts and graphs to any Next.js page. Use this skill whenever
  the user wants to add, replace, or improve a chart or graph in a Next.js
  project — bar chart, line chart, area chart, pie chart, donut chart,
  horizontal bar chart, or any Recharts component. Also triggers when the user
  says "add a graph", "show this data as a chart", "replace the SVG chart",
  "visualize this", or "make a dashboard with charts". Handles package
  installation, 'use client' requirements, ResponsiveContainer, custom
  tooltips, data shaping, and colour theming automatically.
---

# Recharts Graph Adder

You are adding one or more Recharts charts to a Next.js (App Router) page. Follow these steps in order.

## Step 1 — Install recharts if needed

Check `package.json` in the frontend folder. If `recharts` is not in `dependencies`, add it:

```bash
cd <frontend-folder>
npm install recharts
```

Remind the user to **restart the dev server** after installing — Next.js won't pick up new packages on hot reload.

## Step 2 — Read the target file before editing

Always read the full page file before touching it. Understand:
- What data is already available (state, props, API calls)
- What the existing UI looks like
- Where the chart should be placed in the layout

## Step 3 — Choose the right chart type

| Use case | Chart type |
|---|---|
| Compare values across categories | `BarChart` (vertical) |
| Compare ranked items (e.g. top products) | `BarChart` (horizontal, `layout="vertical"`) |
| Show a trend over time | `LineChart` or `AreaChart` |
| Show proportions / parts of a whole | `PieChart` with `innerRadius` (donut) |
| Show multiple metrics side by side | `BarChart` with multiple `Bar` components |

## Step 4 — Required wrappers (always use these)

Every Recharts chart **must** be wrapped in `ResponsiveContainer`. The parent must have a defined height.

```tsx
<div style={{ width: '100%', height: 280 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      ...
    </BarChart>
  </ResponsiveContainer>
</div>
```

The page file **must** have `'use client'` at the top — Recharts uses browser APIs and will fail during SSR without it.

## Step 5 — Shape the data correctly

Recharts expects an **array of plain objects**. Shape the data before passing it to the chart — don't transform inside JSX.

```tsx
// Good — shaped before the return()
const chartData = orders.map(o => ({
  month: o.label,
  sales: o.totalAmount,
}));

// Bad — inline transformation in JSX makes the component messy
<BarChart data={someRawThing.map(...)} />
```

## Step 6 — Standard chart patterns

### Vertical BarChart

```tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

<ResponsiveContainer width="100%" height={260}>
  <BarChart data={chartData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6' }} />
    <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Donut PieChart

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={260}>
  <PieChart>
    <Pie
      data={pieData}
      cx="50%" cy="45%"
      innerRadius={60} outerRadius={90}
      paddingAngle={3}
      dataKey="value"
    >
      {pieData.map((entry, idx) => (
        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6' }} />
    <Legend iconType="circle" iconSize={10} />
  </PieChart>
</ResponsiveContainer>
```

### AreaChart (trends over time)

```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={260}>
  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
    <defs>
      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6' }} />
    <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill="url(#colorValue)" />
  </AreaChart>
</ResponsiveContainer>
```

### Horizontal BarChart (ranked items)

```tsx
<ResponsiveContainer width="100%" height={260}>
  <BarChart data={chartData} layout="vertical" barSize={20} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6' }} />
    <Bar dataKey="value" fill="#6366F1" radius={[0, 6, 6, 0]} />
  </BarChart>
</ResponsiveContainer>
```

## Step 7 — Custom tooltip (use when values need formatting)

```tsx
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="font-bold text-indigo-600">{payload[0].value}</p>
    </div>
  );
};
// Usage: <Tooltip content={<CustomTooltip />} />
```

## Step 8 — Colour palette

```tsx
const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6'];

// For status-based data:
const STATUS_COLORS: Record<string, string> = {
  pending:    '#F59E0B',
  processing: '#6366F1',
  shipped:    '#8B5CF6',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};
```

## Step 9 — Wrap each chart in a card

```tsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-base font-semibold text-gray-900">Chart Title</h2>
      <p className="text-xs text-gray-400 mt-0.5">Subtitle or time range</p>
    </div>
  </div>
  {/* chart goes here */}
</div>
```

## Common mistakes to avoid

- **Forgetting `'use client'`** — Recharts throws a hydration error without it
- **No empty state** — always handle `data.length === 0` with a friendly message
- **Truncated X-axis labels** — for long names use `tick={{ angle: -30 }}` on `XAxis`, or switch to a horizontal bar chart
- **Recharts SSR hydration errors** — if they appear, wrap the chart section in a `mounted` state check or use `dynamic(() => import(...), { ssr: false })`
- **Installing in wrong folder** — `npm install recharts` must run inside the `frontend/` folder, not the project root
