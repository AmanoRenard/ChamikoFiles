"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, Eye, EyeOff, Loader2, User, Lock,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Setup check
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // Site config
  const [siteName, setSiteName] = useState("ChamikoFiles");
  const [smartGradient, setSmartGradient] = useState(true);

  // Check if this is first-run
  useEffect(() => {
    fetch("/api/auth/check-setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNeedsSetup(d.data.needsSetup);
      });
    fetch("/api/config/site")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSiteName(d.data.name || "ChamikoFiles");
          setSmartGradient(d.data.smartGradient ?? true);
        }
      })
      .catch(() => {});
  }, []);

  // Already logged in — redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  // ---- Login submit ----
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("请填写用户名和密码");
      return;
    }
    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "登录失败");
    }
  };

  // Redirect to setup wizard if first-run
  useEffect(() => {
    if (needsSetup) {
      router.replace("/setup");
    }
  }, [needsSetup, router]);

  // ---- Loading state ----
  if (authLoading || needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E]">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  // ==================== FIRST-RUN → REDIRECT TO SETUP WIZARD ====================
  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E]">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  // ==================== NORMAL LOGIN ====================
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-cyan flex items-center justify-center shadow-lg shadow-primary/20 mb-5"
          >
            <Cloud size={28} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1.5">
            {smartGradient ? (() => {
              for (let i = siteName.length - 1; i >= 1; i--) {
                if (siteName[i] >= "A" && siteName[i] <= "Z") {
                  return <>{siteName.slice(0, i)}<span className="gradient-text">{siteName.slice(i)}</span></>;
                }
              }
              return <span className="gradient-text">{siteName}</span>;
            })() : siteName}
          </h1>
          <p className="text-sm text-slate-500">登录</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border border-white/[0.06]">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <User size={13} />
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                autoComplete="username"
                className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Lock size={13} />
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all [&::-ms-reveal]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary-cyan text-white font-medium text-sm flex items-center justify-center hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "登录"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          还没有账号？{" "}
          <Link
            href="/register"
            className="text-primary-light hover:text-primary transition-colors font-medium"
          >
            立即注册
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
