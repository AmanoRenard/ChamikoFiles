"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AuthUser, ApiResponse, SetupCheckResponse } from "@/types";

// ============ Types ============

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  needsSetup: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, nickname: string, invitationCode?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============ Provider ============

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Check auth status & setup state on mount
  useEffect(() => {
    const init = async () => {
      // Check setup
      const setupRes = await fetch("/api/auth/check-setup");
      const setupData: ApiResponse<SetupCheckResponse> = await setupRes.json();
      if (setupData.success && setupData.data) {
        setNeedsSetup(setupData.data.needsSetup);
      }

      // Check current user
      const meRes = await fetch("/api/auth/me");
      const meData: ApiResponse<AuthUser> = await meRes.json();
      if (meData.success && meData.data) {
        setUser(meData.data);
      }

      setLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data: ApiResponse<AuthUser> = await res.json();
    if (data.success && data.data) {
      setUser(data.data);
      return { success: true };
    }
    return { success: false, error: data.error || "登录失败" };
  }, []);

  const register = useCallback(
    async (username: string, password: string, nickname: string, invitationCode?: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, nickname, invitationCode }),
      });
      const data: ApiResponse<AuthUser> = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        return { success: true };
      }
      return { success: false, error: data.error || "注册失败" };
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const meRes = await fetch("/api/auth/me");
    const meData: ApiResponse<AuthUser> = await meRes.json();
    if (meData.success && meData.data) {
      setUser(meData.data);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, needsSetup, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============ Hook ============

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
