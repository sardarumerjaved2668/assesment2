'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Fallback mock users for when backend is unavailable
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: 'user-1',
    email: 'customer@store.com',
    password: 'Customer123!',
    firstName: 'John',
    lastName: 'Customer',
    role: 'customer',
  },
  {
    id: 'user-2',
    email: 'admin@store.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
];

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem('auth_token');
      const storedUser = sessionStorage.getItem('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // Try real backend first
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const userData: User = data.user;
        const accessToken: string = data.access_token;
        setUser(userData);
        setToken(accessToken);
        try {
          sessionStorage.setItem('auth_token', accessToken);
          sessionStorage.setItem('auth_user', JSON.stringify(userData));
        } catch {
          // ignore storage errors
        }
        setIsLoading(false);
        return { success: true };
      }

      if (res.status === 401) {
        setIsLoading(false);
        return { success: false, error: 'Invalid email or password.' };
      }

      // Unexpected backend error — fall through to mock
    } catch {
      // Backend not running — fall back to mock auth
    }

    // Mock fallback
    await new Promise((r) => setTimeout(r, 400));
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password,
    );
    setIsLoading(false);

    if (found) {
      const { password: _pw, ...userData } = found;
      const mockToken = `mock_token_${userData.id}`;
      setUser(userData);
      setToken(mockToken);
      try {
        sessionStorage.setItem('auth_token', mockToken);
        sessionStorage.setItem('auth_user', JSON.stringify(userData));
      } catch {
        // ignore
      }
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password.' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
