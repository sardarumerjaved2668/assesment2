'use client';

import { DASHBOARD_STATS, PRODUCTS } from '@/lib/dummy-data';
import StatsCard from '@/components/StatsCard';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
};

export default function AdminDashboardPage() {
  const stats = DASHBOARD_STATS;
  const averageOrder = stats.totalSales / stats.totalOrders;

  const statusEntries = Object.entries(stats.ordersByStatus);
  const maxVal = Math.max(...statusEntries.map(([, v]) => v));

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

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
          value={PRODUCTS.length.toString()}
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
                const barWidth = 48;
                const gap = 20;
                const x = idx * (barWidth + gap) + 20;
                const barH = (count / maxVal) * 80;
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
                      className="text-xs"
                      fontSize="9"
                      fill="#6B7280"
                    >
                      {status.slice(0, 4)}
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
        </div>

        {/* Top selling products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Units</th>
                  <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.topProducts.map(({ product, sold }, idx) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-400 font-medium">#{idx + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded object-cover bg-gray-100" />
                        <div>
                          <p className="font-medium text-gray-900 text-xs line-clamp-1">{product.name}</p>
                          <p className="text-gray-400 text-xs">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-700">{sold}</td>
                    <td className="py-3 text-right font-bold text-gray-900">
                      ${(product.price * sold).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
