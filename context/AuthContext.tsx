"use client";
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '../services/auth';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  saveAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const syncAuthCookie = (value: string | null) => {
    if (typeof window === 'undefined') return;

    if (value) {
      document.cookie = `orbynex_token=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      return;
    }

    document.cookie = 'orbynex_token=; path=/; max-age=0; samesite=lax';
  };

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
  }, []);

  const saveAuth = (u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    }
    syncAuthCookie(t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    syncAuthCookie(null);
  };

  return <AuthContext.Provider value={{ user, token, saveAuth, logout }}>{children}</AuthContext.Provider>;
};
