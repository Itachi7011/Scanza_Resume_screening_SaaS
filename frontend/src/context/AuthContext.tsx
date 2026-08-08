"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "@/lib/axios";

export type AccountRole = "SUPER_ADMIN" | "ADMIN" | "CLIENT_OWNER" | "CLIENT_MEMBER" | "END_USER";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: AccountRole;
  status: string;
  isEmailVerified: boolean;
  preferredTheme: string;
  clientId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/auth/me");
      setUser(data.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await axios.post("/api/auth/logout").catch(() => void 0);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: Boolean(user), refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
