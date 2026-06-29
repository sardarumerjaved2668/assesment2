'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/lib/types';

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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    setIsLoading(false);
    if (found) {
      const { password: _pw, ...userData } = found;
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
