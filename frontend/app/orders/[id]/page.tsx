'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ORDERS } from '@/lib/dummy-data';
import { Order } from '@/lib/types';
import { fetchOrder } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OrderStatusBadge from '@/components/OrderStatusBadge';

interface PageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = params;
  const { token } = useAuthContext();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMissing(false);

    const load = async () => {
      try {
        if (token && !token.startsWith('mock_')) {
          const data = await fetchOrder(id, token);
          if (!cancelled) setOrder(data);
        } else {
          const fallback = ORDERS.find((o) => o.id === id);
          if (cancelled) return;
          if (fallback) setOrder(fallback);
          else setMissing(true);
        }
      } catch {
        const fallback = ORDERS.find((o) => o.id === id);
        if (cancelled) return;
        if (fallback) setOrder(fallback);
        else setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const shippingAddress = order?.shippingAddress;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 h-28" />
              <div className="bg-white rounded-2xl border border-gray-100 p-6 h-16" />
              <div className="bg-white rounded-2xl border border-gray-100 p-6 h-64" />
            </div>
          ) : missing || !order ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
              <p className="text-gray-500 text-sm mb-6">This order does not exist or you do not have access to it.</p>
              <Link href="/orders" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all text-sm">
                Back to Orders
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                      #{String(order.id).slice(-8).toUpperCase()}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              {order.status !== 'cancelled' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Order Progress</h2>
                  <div className="flex items-center flex-wrap gap-y-3">
                    {(['pending', 'processing', 'shipped', 'delivered'] as const).map((s, i) => {
                      const statuses = ['pending', 'processing', 'shipped', 'delivered'];
                      const currentIdx = statuses.indexOf(order.status);
                      const isDone = i <= currentIdx;
                      return (
                        <div key={s} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDone ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {isDone ? '✓' : i + 1}
                          </div>
                          <span className={`ml-2 text-xs font-medium capitalize ${isDone ? 'text-indigo-600' : 'text-gray-400'}`}>{s}</span>
                          {i < 3 && <div className={`flex-1 h-0.5 mx-3 min-w-8 ${i < currentIdx ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="font-bold text-gray-900">Order Items</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 px-6 py-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-14 h-14 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.product.category}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.quantity} x ${item.priceAtPurchase.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                            ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-700">Order Total</span>
                      <span className="text-lg font-black text-indigo-700">${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-4">Summary</h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                        <span className="font-medium text-gray-900">${order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span className="font-medium text-emerald-600">Free</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                        <span>Total</span>
                        <span>${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                        <span>✓</span> Payment Confirmed
                      </div>
                    </div>
                  </div>

                  {shippingAddress && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-bold text-gray-900 mb-3">Shipping Address</h2>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-semibold text-gray-900">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                        <p>{shippingAddress.address}</p>
                        <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                        <p>{shippingAddress.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
