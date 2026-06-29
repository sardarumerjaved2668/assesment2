'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/StatsCard';
import { useAuthContext } from '@/context/AuthContext';
import { fetchAdminDashboardStats, AdminDashboardStats } from '@/lib/api';
import { DASHBOARD_STATS, PRODUCTS } from '@/lib/dummy-data';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

// Normalised shape used in the UI
interface TopProduct {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  price: number;
  sold: number;
  revenue: number;
}

interface NormalisedStats {
  totalSales: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  topProducts: TopProduct[];
}

function normaliseDummyStats(): NormalisedStats {
  const s = DASHBOARD_STATS;
  return {
    totalSales: s.totalSales,
    totalOrders: s.totalOrders,
    ordersByStatus: s.ordersByStatus,
    topProducts: s.topProducts.map(({ product, sold }) => ({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      category: product.category,
      price: product.price,
      sold,
      revenue: product.price * sold,
    })),
  };
}

function normaliseApiStats(data: AdminDashboardStats): NormalisedStats {
  return {
    totalSales: data.totalSales,
    totalOrders: data.totalOrders,
    ordersByStatus: data.ordersByStatus,
    topProducts: data.topProducts.map((p) => ({
      id: p.productId,
      name: p.name,
      imageUrl: p.imageUrl,
      category: p.category,
      price: p.price,
      sold: p.sold,
      revenue: p.revenue,
    })),
  };
}

export default function AdminDashboardPage() {
  const { token } = useAuthContext();

  const [stats, setStats] = useState<NormalisedStats>(normaliseDummyStats());
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    const isMock = token.startsWith('mock_');
    if (isMock) { setLoading(false); return; }

    fetchAdminDashboardStats(token)
      .then((data) => {
        setStats(normaliseApiStats(data));
        setIsLive(true);
      })
      .catch(() => {
        // keep dummy fallback silently
      })
      .finally(() => setLoading(false));
  }, [token]);

  const averageOrder = stats.totalOrders > 0 ? stats.totalSales / stats.totalOrders : 0;
  const statusEntries = Object.entries(stats.ordersByStatus);
  const maxVal = Math.max(...statusEntries.map(([, v]) => v), 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {!loading && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isLive ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
            {isLive ? '● Live data' : '● Demo data'}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Sales"
          value={`$${stats.totalSales.toLocaleString()}`}
          subtitle="All time revenue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          subtitle="Across all statuses"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="Average Order Value"
          value={`$${averageOrder.toFixed(2)}`}
          subtitle="Per order"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatsCard
          title="Products"
          value={isLive ? `${stats.topProducts.length}+` : PRODUCTS.length.toString()}
          subtitle="In catalog"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart - orders by status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Orders by Status</h2>
          <div className="space-y-4">
            {statusEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / maxVal) * 100}%`,
                      backgroundColor: STATUS_COLORS[status] ?? '#6B7280',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* SVG bar chart */}
          <div className="mt-6">
            <svg viewBox="0 0 320 120" className="w-full" role="img" aria-label="Orders by status bar chart">
              {statusEntries.map(([status, count], idx) => {
                const barWidth = 44;
                const gap = 14;
                const cols = statusEntries.length;
                const totalW = cols * barWidth + (cols - 1) * gap;
                const startX = (320 - totalW) / 2;
                const x = startX + idx * (barWidth + gap);
                const barH = Math.max(4, (count / maxVal) * 80);
                const y = 90 - barH;
                return (
                  <g key={status}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx={4}
                      fill={STATUS_COLORS[status] ?? '#6B7280'}
                      opacity={0.85}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={108}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#6B7280"
                    >
                      {status.slice(0, 5)}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={y - 4}
                      textAnchor="middle"
          