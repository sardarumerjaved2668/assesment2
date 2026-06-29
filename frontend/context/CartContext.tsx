'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { CartItem, Product } from '@/lib/types';
import {
  getCart,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
  CartResponse,
} from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => void;
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  error: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Map a backend cart response into the {product, quantity} shape the UI uses.
function mapResponse(res: CartResponse): CartItem[] {
  return (res.items || [])
    .filter((line) => line.product)
    .map((line) => ({ product: line.product as Product, quantity: line.quantity }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuthContext();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A real, server-backed session (mock tokens use local storage instead).
  const isAuthed = !!(user && token && !token.startsWith('mock_'));

  // Load the cart from the server (logged in) or localStorage (guest/demo).
  const refreshCart = useCallback(async () => {
    if (isAuthed && token) {
      setLoading(true);
      setError(null);
      try {
        const res = await getCart(token);
        setItems(mapResponse(res));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cart');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const stored = localStorage.getItem('cart');
        setItems(stored ? JSON.parse(stored) : []);
      } catch {
        setItems([]);
      }
    }
  }, [isAuthed, token]);

  // Reload whenever the auth state changes (login / logout).
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Persist guest/demo carts to localStorage only (server is the source of
  // truth for logged-in users).
  useEffect(() => {
    if (!isAuthed) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isAuthed]);

  const addToCart = useCallback(
    async (product: Product, quantity: number) => {
      if (isAuthed && token) {
        setLoading(true);
        setError(null);
        try {
          const res = await addToCartApi(product.id, quantity, token);
          setItems(mapResponse(res));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to add to cart');
        } finally {
          setLoading(false);
        }
        return;
      }
      // Guest/demo — update locally.
      setItems((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + quantity,
                    product.stockQuantity || item.quantity + quantity,
                  ),
                }
              : item,
          );
        }
        return [...prev, { product, quantity }];
      });
    },
    [isAuthed, token],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (isAuthed && token) {
        setLoading(true);
        setError(null);
        try {
          const res = await removeCartItemApi(productId, token);
          setItems(mapResponse(res));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to remove item');
        } finally {
          setLoading(false);
        }
        return;
      }
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
    },
    [isAuthed, token],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }
      if (isAuthed && token) {
        setLoading(true);
        setError(null);
        try {
          const res = await updateCartItemApi(productId, quantity, token);
          setItems(mapResponse(res));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update quantity');
        } finally {
          setLoading(false);
        }
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      );
    },
    [isAuthed, token, removeFromCart],
  );

  const clearCart = useCallback(async () => {
    if (isAuthed && token) {
      setLoading(true);
      setError(null);
      try {
        await clearCartApi(token);
        setItems([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clear cart');
      } finally {
        setLoading(false);
      }
      return;
    }
    setItems([]);
  }, [isAuthed, token]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        cartCount,
        cartTotal,
        loading,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
}
