'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { fetchOrders } from '@/lib/api';
import { Order } from '@/lib/types';

export interface AppNotification {
  id: string;
  type: 'order_placed' | 'order_status' | 'welcome' | 'admin_new_order';
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [], unreadCount: 0,
  markAsRead: () => {}, markAllAsRead: () => {}, clearAll: () => {},
});

export function useNotifications() { return useContext(NotificationsContext); }

const STATUS_LABELS: Record<string, string> = {
  pending:    'received and is pending',
  processing: 'now being processed',
  shipped:    'on its way',
  delivered:  'delivered',
  cancelled:  'cancelled',
};

const STATUS_TITLES: Record<string, string> = {
  processing: 'Order Processing',
  shipped:    'Order Shipped! 🚚',
  delivered:  'Order Delivered! ✅',
  cancelled:  'Order Cancelled',
};

function storageKey(userId: string) { return `notifications_${userId}`; }
function knownStatusKey(userId: string) { return `order_statuses_${userId}`; }

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthContext();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const initialised = useRef(false);

  /* ── Persist to localStorage ────────────────────────────────────────────── */
  const persist = useCallback((notifs: AppNotification[], userId: string) => {
    try { localStorage.setItem(storageKey(userId), JSON.stringify(notifs)); } catch {}
  }, []);

  /* ── Load stored notifications on user change ───────────────────────────── */
  useEffect(() => {
    initialised.current = false;
    if (!user) { setNotifications([]); return; }
    try {
      const stored = localStorage.getItem(storageKey(user.id));
      setNotifications(stored ? JSON.parse(stored) : []);
    } catch { setNotifications([]); }
  }, [user?.id]);

  /* ── Poll orders and generate notifications ─────────────────────────────── */
  const sync = useCallback(async () => {
    if (!user || !token) return;

    // First-time welcome notification
    const key = storageKey(user.id);
    const existing: AppNotification[] = (() => {
      try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
    })();

    const newNotifs: AppNotification[] = [...existing];
    let changed = false;

    // Add welcome notification once
    if (!newNotifs.some((n) => n.type === 'welcome')) {
      newNotifs.unshift({
        id: `welcome_${user.id}`,
        type: 'welcome',
        title: `Welcome, ${user.firstName}! 👋`,
        message: 'Thanks for joining ShopNext. Start exploring products.',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }

    // Skip real API for mock tokens
    if (!token.startsWith('mock_')) {
      let orders: Order[] = [];
      try { orders = await fetchOrders(token); } catch { return; }

      const statusMapRaw = localStorage.getItem(knownStatusKey(user.id));
      const knownStatuses: Record<string, string> = statusMapRaw ? JSON.parse(statusMapRaw) : {};
      const updatedStatuses: Record<string, string> = {};

      for (const order of orders) {
        const shortId = order.id.slice(-6).toUpperCase();
        const prev    = knownStatuses[order.id];
        updatedStatuses[order.id] = order.status;

        if (!prev) {
          // New order seen for first time
          if (user.role === 'admin') {
            // Admins see "new order placed" notifications
            const adminId = `admin_order_${order.id}`;
            if (!newNotifs.some((n) => n.id === adminId)) {
              newNotifs.unshift({
                id: adminId,
                type: 'admin_new_order',
                title: 'New Order Placed',
                message: `Order #${shortId} was placed for $${order.totalAmount.toFixed(2)}.`,
                orderId: order.id,
                isRead: false,
                createdAt: order.createdAt,
              });
              changed = true;
            }
          } else {
            // Customer sees order confirmation
            const confirmId = `order_placed_${order.id}`;
            if (!newNotifs.some((n) => n.id === confirmId)) {
              newNotifs.unshift({
                id: confirmId,
                type: 'order_placed',
                title: 'Order Confirmed ✓',
                message: `Your order #${shortId} has been received. Total: $${order.totalAmount.toFixed(2)}.`,
                orderId: order.id,
                isRead: false,
                createdAt: order.createdAt,
              });
              changed = true;
            }
          }
        } else if (prev !== order.status && STATUS_TITLES[order.status]) {
          // Status changed
          const statusId = `status_${order.id}_${order.status}`;
          if (!newNotifs.some((n) => n.id === statusId)) {
            newNotifs.unshift({
              id: statusId,
              type: 'order_status',
              title: STATUS_TITLES[order.status],
              message: `Order #${shortId} is ${STATUS_LABELS[order.status] ?? order.status}.`,
              orderId: order.id,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
            changed = true;
          }
        }
      }

      localStorage.setItem(knownStatusKey(user.id), JSON.stringify(updatedStatuses));
    }

    // Keep max 20 notifications
    const trimmed = newNotifs.slice(0, 20);

    if (changed || !initialised.current) {
      initialised.current = true;
      setNotifications(trimmed);
      persist(trimmed, user.id);
    }
  }, [user, token, persist]);

  /* ── Initial sync + 30-second polling ──────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    sync();
    const interval = setInterval(sync, 30_000);
    return () => clearInterval(interval);
  }, [user, sync]);

  /* ── Actions ────────────────────────────────────────────────────────────── */
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, isRead: true } : n);
      if (user) persist(next, user.id);
      return next;
    });
  }, [user, persist]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      if (user) persist(next, user.id);
      return next;
    });
  }, [user, persist]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (user) persist([], user.id);
  }, [user, persist]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationsContext.Provider>
  );
}
