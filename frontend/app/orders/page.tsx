'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ORDERS } from '@/lib/dummy-data';
import { Order } from '@/lib/types';
import { fetchOrders } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OrderStatusBadge from '@/components/OrderStatusBadge';

function getStatusBorderColor(status: string) {
  switch (status) {
    case 'pending': return 'border-amber-400';
    case 'processing': return 'border-blue-400';
    case 'shipped': return 'border-violet-400';
    case 'delivered': return 'border-emerald-400';
    case 'cancelled': return 'border-red-400';
    default: return 'border-gray-200';
  }
}

export default function OrdersPage() {
  const { user, token } = useAuthContext();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        if (token && !token.startsWith('mock_')) {
          const data = await fetchOrders(token);
          if (!cancelled) setOrders(data);
        } else {
          if (!cancelled) setOrders(ORDERS);
        }
      } catch {
        if (!cancelled) setOrders(ORDERS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, token]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            {!loading && orders.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full text-sm font-semibold ml-3">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
                      <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded-full" />
                  </div>
                  <div className="border-t border-gray-50 pt-4 flex gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full -ml-2" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full -ml-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Start shopping to place your first order!</p>
              <Link href="/" className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all text-sm">
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block">
                  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${getStatusBorderColor(order.status)} p-5 hover:shadow-md transition-all`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-bold text-gray-900 font-mono text-sm">
                            #{String(order.id).slice(-8).toUpperCase()}
                          </span>
                          <OrderStatusBadge status={order.status} />
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1 justify-end font-medium">
                          View Details &#8594;
                        </p>
                      </div>
                    </div>

                    {order.items.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden"
                              style={{ zIndex: 3 - idx }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 ml-1 truncate">
                          {order.items.slice(0, 3).map((i) => i.product.name).join(', ')}
                          {order.items.length > 3 && ` +${order.items.length - 3} more`}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
