"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  Eye,
  EyeOff,
  Loader2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

/** 密码需至少8位，且至少包含字母、数字、特殊字符中的两种 */
function isPasswordValid(pwd: string): boolean {
  if (pwd.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/.test(pwd);
  const categories = [hasLetter, hasDigit, hasSpecial].filter(Boolean).length;
  return categories >= 2;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/check-setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNeedsSetup(d.data.needsSetup);
      });
  }, []);

  // Already logged in — redirect to home (deferred to avoid setState-during-render)
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password || !nickname.trim()) {
      setError("请填写所有必填字段");
      return;
    }
    if (username.trim().length < 2) {
      setError("用户名至少需要 2 个字符");
      return;
    }
    if (nickname.trim().length < 1 || nickname.trim().length > 32) {
      setError("昵称需要 1-32 个字符");
      return;
    }
    if (password.length < 8) {
      setError("密码至少需要 8 个字符");
      return;
    }
    if (!isPasswordValid(password)) {
      setError("密码需至少8位，且至少包含字母、数字、特殊字符中的两种");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }
    if (!needsSetup && !invitationCode.trim()) {
      setError("请输入邀请码");
      return;
    }

    setSubmitting(true);
    const result = await register(
      username.trim(),
      password,
      nickname.trim(),
      needsSetup ? undefined : invitationCode.trim()
    );
    setSubmitting(false);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "注册失败");
    }
  };

  if (authLoading || needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-8">
      {/* Background */}
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
            Chamiko<span className="gradient-text">Files</span>
          </h1>
          <p className="text-sm text-slate-500">
            {needsSetup ? "首次设置 - 创建管理员账号" : "注册新账号"}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border border-white/[0.06]">
          {needsSetup && (
            <div className="flex items-start gap-2.5 mb-5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Shield size={18} className="text-primary-light flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary-light/80 leading-relaxed">
                这是首次设置，注册的账号将自动成为系统唯一管理员。后续用户注册需要邀请码。
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="2-32 个字符"
                autoComplete="username"
                className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入显示昵称"
                autoComplete="nickname"
                className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 8 个字符"
                  autoComplete="new-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                  style={
                    {
                      WebkitTextSecurity: showPassword ? "none" : undefined,
                    } as React.CSSProperties
                  }
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                autoComplete="new-password"
                className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Invitation Code — only for non-first users */}
            <AnimatePresence>
              {needsSetup === false && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    邀请码
                  </label>
                  <input
                    type="text"
                    value={invitationCode}
                    onChange={(e) =>
                      setInvitationCode(e.target.value.toUpperCase())
                    }
                    placeholder="输入 8 位邀请码"
                    maxLength={8}
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all uppercase tracking-widest"
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
                ) : needsSetup ? (
                  "创建管理员账号"
                ) : (
                  "注册"
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          已有账号？{" "}
          <Link
            href="/login"
            className="text-primary-light hover:text-primary transition-colors font-medium"
          >
            立即登录
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
