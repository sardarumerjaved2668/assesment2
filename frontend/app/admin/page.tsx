'use client';

import { useState, useEffect } from 'react';
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

  const statCards = [
    {
      label: 'Total Sales',
      value: `$${stats.totalSales.toLocaleString()}`,
      trend: '12% vs last month',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      trend: '8% vs last month',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Avg. Order Value',
      value: `$${averageOrder.toFixed(2)}`,
      trend: '3% vs last month',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Products',
      value: isLive ? `${stats.topProducts.length}+` : PRODUCTS.length.toString(),
      trend: 'In catalog',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back — here is what is happening.</p>
        </div>
        {!loading && (
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isLive ? 'Live data' : 'Demo data'}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`w-12 h-12 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center`}>
              {card.icon}
            </div>
            <p className="text-3xl font-black text-gray-900 mt-4">{card.value}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{card.label}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1">{card.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Orders by Status</h2>

          {/* Progress bars */}
          <div className="space-y-4">
            {statusEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
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
                      fontSize="9"
                      fill="#374151"
                      fontWeight="600"
                    >
                      {count}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {statusEntries.map(([status]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[status] ?? '#6B7280' }}
                />
                <span className="text-xs text-gray-600 capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Top Selling Products</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No sales data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="pb-2 pt-2 px-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                    <th className="pb-2 pt-2 px-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="pb-2 pt-2 px-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Units</th>
                    <th className="pb-2 pt-2 px-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topProducts.map(({ id, name, imageUrl, category, sold, revenue }, idx) => (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl || '/placeholder.png'}
                            alt={name}
                            className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                          />
                          <div>
                            <p className="font-semibold text-gray-900 text-xs line-clamp-1">{name}</p>
                            <p className="text-gray-400 text-xs">{category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {sold}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-600">
                        ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
