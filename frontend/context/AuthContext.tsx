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
  // Start true so the admin layout waits before deciding to redirect.
  // Set to false once session restore is complete (whether or not a session exists).
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from sessionStorage on mount.
  // For real JWT tokens we call /auth/me to validate and get fresh user data.
  // For mock tokens we trust the stored user directly (backend may be offline).
  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = sessionStorage.getItem('auth_token');
        const storedUser = sessionStorage.getItem('auth_user');

        if (!storedToken || !storedUser) {
          setIsLoading(false);
          return;
        }

        // Mock tokens — trust the stored user without a network call
        if (storedToken.startsWith('mock_')) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
          return;
        }

        // Real JWT — validate with the backend and use the fresh response
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            signal: AbortSignal.timeout(4000),
          });

          if (res.ok) {
            const freshUser: User = await res.json();
            setToken(storedToken);
            setUser(freshUser);
            // Persist refreshed user data
            sessionStorage.setItem('auth_user', JSON.stringify(freshUser));
          } else {
            // Token expired or invalid — clear storage
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_user');
          }
        } catch {
          // Backend unreachable — trust the stored user so admins aren't locked out
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // sessionStorage unavailable (e.g. private browsing edge cases) — ignore
      } finally {
        setIsLoading(false);
      }
    };

    restore();
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
         