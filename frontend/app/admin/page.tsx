'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuthContext } from '@/context/AuthContext';
import { fetchAdminDashboardStats, AdminDashboardStats } from '@/lib/api';
import { DASHBOARD_STATS, PRODUCTS } from '@/lib/dummy-data';

// ── Colours ───────────────────────────────────────────────────────────────────
const STATUS_PALETTE: Record<string, string> = {
  pending:    '#F59E0B',
  processing: '#6366F1',
  shipped:    '#8B5CF6',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface TopProduct {
  id: string; name: string; imageUrl: string;
  category: string; price: number; sold: number; revenue: number;
}
interface NormalisedStats {
  totalSales: number; totalOrders: number;
  ordersByStatus: Record<string, number>; topProducts: TopProduct[];
}

// ── Data normalisation ────────────────────────────────────────────────────────
function normaliseDummyStats(): NormalisedStats {
  const s = DASHBOARD_STATS;
  return {
    totalSales: s.totalSales, totalOrders: s.totalOrders,
    ordersByStatus: s.ordersByStatus,
    topProducts: s.topProducts.map(({ product, sold }) => ({
      id: product.id, name: product.name, imageUrl: product.imageUrl,
      category: product.category, price: product.price, sold,
      revenue: product.price * sold,
    })),
  };
}
function normaliseApiStats(data: AdminDashboardStats): NormalisedStats {
  return {
    totalSales: data.totalSales, totalOrders: data.totalOrders,
    ordersByStatus: data.ordersByStatus,
    topProducts: data.topProducts.map((p) => ({
      id: p.productId, name: p.name, imageUrl: p.imageUrl,
      category: p.category, price: p.price, sold: p.sold, revenue: p.revenue,
    })),
  };
}

// ── Custom tooltip for bar chart ──────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 capitalize mb-1">{label}</p>
      <p className="text-indigo-600 font-bold">{payload[0].value} orders</p>
    </div>
  );
};

// ── Custom tooltip for pie chart ──────────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 capitalize mb-1">{name}</p>
      <p className="font-bold" style={{ color: STATUS_PALETTE[name] }}>{value} orders</p>
    </div>
  );
};

// ── Custom legend for pie ─────────────────────────────────────────────────────
const PieLegend = ({ payload }: any) => (
  <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-3">
    {payload.map((entry: any) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
        <span className="text-xs text-gray-500 capitalize">{entry.value}</span>
      </div>
    ))}
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { token } = useAuthContext();
  const [stats, setStats] = useState<NormalisedStats>(normaliseDummyStats());
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    if (token.startsWith('mock_')) { setLoading(false); return; }
    fetchAdminDashboardStats(token)
      .then((data) => { setStats(normaliseApiStats(data)); setIsLive(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const averageOrder = stats.totalOrders > 0 ? stats.totalSales / stats.totalOrders : 0;

  // Bar chart data — orders by status
  const barData = Object.entries(stats.ordersByStatus).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    orders: count,
    fill: STATUS_PALETTE[status] ?? '#6B7280',
  }));

  // Pie chart data — same data, donut style
  const pieData = Object.entries(stats.ordersByStatus)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  // Horizontal bar data — top products by revenue
  const productBarData = stats.topProducts.slice(0, 5).map((p) => ({
    name: p.name.length > 16 ? p.name.slice(0, 15) + '…' : p.name,
    revenue: p.revenue,
    sold: p.sold,
  }));

  const statCards = [
    {
      label: 'Total Sales',
      value: `$${stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: '12% vs last month',
      gradient: 'from-indigo-500 to-indigo-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      sub: '8% vs last month',
      gradient: 'from-emerald-500 to-emerald-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Avg. Order Value',
      value: `$${averageOrder.toFixed(2)}`,
      sub: '3% vs last month',
      gradient: 'from-violet-500 to-violet-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Products',
      value: isLive ? `${stats.topProducts.length}+` : PRODUCTS.length.toString(),
      sub: 'In catalog',
      gradient: 'from-amber-500 to-amber-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Welcome back — here's what's happening.</p>
        </div>
        {!loading && (
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border ${isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isLive ? 'Live data' : 'Demo data'}
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`h-1 w-full bg-gradient-to-r ${card.gradient}`} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-sm`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{card.value}</p>
              <p className="text-xs font-medium text-emerald-600 mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Bar chart + Donut chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Orders by Status — Recharts BarChart */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Orders by Status</h2>
              <p className="text-xs text-gray-400 mt-0.5">All time breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: '#F9FAFB', radius: 8 }} />
              <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution — Recharts PieChart donut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">Status Split</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of all orders</p>
          </div>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">No orders yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={STATUS_PALETTE[entry.name] ?? '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend content={<PieLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Top products revenue bar + product list */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Revenue by top product — horizontal BarChart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">Revenue by Product</h2>
            <p className="text-xs text-gray-400 mt-0.5">Top 5 products by revenue</p>
          </div>
          {productBarData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">No sales data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={productBarData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', fontSize: '13px' }}
                />
                <Bar dataKey="revenue" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Selling Products — card list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">Top Selling Products</h2>
            <p className="text-xs text-gray-400 mt-0.5">By units sold</p>
          </div>

          {stats.topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-sm text-gray-400">No sales data yet.</div>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.slice(0, 5).map(({ id, name, imageUrl, category, sold, revenue }, idx) => (
                <div key={id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-500' :
                    idx === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl || '/placeholder.svg'}
                    alt={name}
                    className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400">{category}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-sm font-bold text-gray-900">{sold}</p>
                    <p className="text-xs text-gray-400">sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">
                      ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
