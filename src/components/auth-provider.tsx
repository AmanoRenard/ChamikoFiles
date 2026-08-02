"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthUser, ApiResponse, SetupCheckResponse } from "@/types";
import { Loader2 } from "lucide-react";

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

// Pages that don't require authentication
const PUBLIC_PAGES = ["/login", "/register", "/setup"];

// ============ Provider ============

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Check auth status & setup state on mount
  useEffect(() => {
    const init = async () => {
      // Check setup first
      const setupRes = await fetch("/api/auth/check-setup");
      const setupData: ApiResponse<SetupCheckResponse> = await setupRes.json();
      const isFirstRun = setupData.success && setupData.data?.needsSetup;
      if (isFirstRun) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }
      setNeedsSetup(false);

      // Only check current user if setup is already done (not first-run)
      const meRes = await fetch("/api/auth/me");
      const meData: ApiResponse<AuthUser> = await meRes.json();
      if (meData.success && meData.data) {
        setUser(meData.data);
      }

      setLoading(false);
    };
    init();
  }, []);

  // Redirect to /login if not authenticated and not on a public page
  useEffect(() => {
    if (!loading && !user && !PUBLIC_PAGES.includes(pathname)) {
      router.replace("/login");
    }
  }, [loading, user, pathname, router]);

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

  // While loading or redirecting (unauthenticated), don't render children
  // This prevents pages like home from firing API requests with stale cookies
  if (loading || (!user && !PUBLIC_PAGES.includes(pathname))) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E] z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

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
