'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ORDERS } from '@/lib/dummy-data';
import { Order, OrderStatus } from '@/lib/types';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { useAuthContext } from '@/context/AuthContext';
import { fetchOrders, updateOrderStatus } from '@/lib/api';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const { token } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!token || token.startsWith('mock_')) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchOrders(token);
      setOrders(data);
      setIsLive(true);
    } catch {
      // keep dummy fallback
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    if (!token || token.startsWith('mock_')) return;

    setUpdatingId(orderId);
    setError(null);
    try {
      const updated = await updateOrderStatus(orderId, newStatus, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated, status: updated.status as OrderStatus } : o))
      );
    } catch (err: any) {
      setError(`Failed to update order: ${err?.message ?? 'Unknown error'}`);
      // Reload to restore correct state
      loadOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isLive ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {isLive ? '● Live data' : '● Demo data'}
            </span>
          )}
          {isLive && (
            <button
              onClick={() => { setLoading(true); loadOrders(); }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-500 text-sm">Loading orders…</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders found.</td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const addr = order.shippingAddress;
                    const customerName = addr
                      ? `${addr.firstName} ${addr.lastName}`
                      : 'Unknown';
                    const isUpdating = updatingId === order.id;
                    const itemCount = Array.isArray(order.