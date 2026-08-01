"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, Eye, EyeOff, Loader2, Shield, FolderOpen, Users,
  Lock, CheckCircle2, ArrowRight, Server,
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

const featureCards = [
  {
    icon: FolderOpen,
    title: "文件存储",
    desc: "安全可靠的文件存储与管理",
    color: "text-primary-light",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Users,
    title: "共享协作",
    desc: "创建共享空间，团队协作",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: Lock,
    title: "安全私密",
    desc: "加密传输，权限精细管控",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user, loading: authLoading } = useAuth();

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Setup / onboarding state
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [setupUsername, setSetupUsername] = useState("");
  const [setupNickname, setSetupNickname] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");

  // Check if this is first-run
  useEffect(() => {
    fetch("/api/auth/check-setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNeedsSetup(d.data.needsSetup);
      });
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

  // ---- Setup / first-run admin registration ----
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");

    if (!setupUsername.trim() || !setupPassword || !setupNickname.trim()) {
      setSetupError("请填写所有必填字段");
      return;
    }
    if (setupUsername.trim().length < 2) {
      setSetupError("用户名至少需要 2 个字符");
      return;
    }
    if (setupNickname.trim().length < 1 || setupNickname.trim().length > 32) {
      setSetupError("昵称需要 1-32 个字符");
      return;
    }
    if (setupPassword.length < 8) {
      setSetupError("密码至少需要 8 个字符");
      return;
    }
    if (!isPasswordValid(setupPassword)) {
      setSetupError("密码需至少8位，且至少包含字母、数字、特殊字符中的两种");
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setSetupError("两次密码输入不一致");
      return;
    }

    setSetupSubmitting(true);
    const result = await register(
      setupUsername.trim(),
      setupPassword,
      setupNickname.trim(),
      undefined // No invitation code for first user
    );
    setSetupSubmitting(false);

    if (result.success) {
      router.push("/");
    } else {
      setSetupError(result.error || "创建失败");
    }
  };

  // ---- Loading state ----
  if (authLoading || needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E]">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  // ==================== FIRST-RUN ONBOARDING ====================
  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-10">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-2xl"
        >
          {/* Brand & Welcome */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary-light to-primary-cyan flex items-center justify-center shadow-xl shadow-primary/30 mb-6"
            >
              <Server size={32} className="text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-3xl font-bold text-slate-100 mb-3 tracking-tight"
            >
              Chamiko<span className="gradient-text">Files</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-400 text-sm"
            >
              系统初始化 &mdash; 创建管理员账号以开始使用
            </motion.p>
          </div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            {featureCards.map((fc, i) => (
              <motion.div
                key={fc.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`${fc.bg} border ${fc.border} rounded-2xl p-4 text-center hover:border-white/10 transition-all duration-300`}
              >
                <div className={`w-9 h-9 rounded-xl ${fc.bg} flex items-center justify-center mx-auto mb-2.5`}>
                  <fc.icon size={18} className={fc.color} />
                </div>
                <h3 className="text-xs font-semibold text-slate-200 mb-1">{fc.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{fc.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Admin Registration Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-7 border border-white/[0.06]"
          >
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/[0.04]">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield size={16} className="text-primary-light" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">创建管理员账号</h2>
                <p className="text-[11px] text-slate-500">此账号拥有系统最高权限，后续用户注册需要邀请码</p>
              </div>
            </div>

            <form onSubmit={handleSetup} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  placeholder="2-32 个字符"
                  autoComplete="username"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">昵称</label>
                <input
                  type="text"
                  value={setupNickname}
                  onChange={(e) => setSetupNickname(e.target.value)}
                  placeholder="输入显示昵称"
                  autoComplete="nickname"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type={showSetupPassword ? "text" : "password"}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="至少 8 个字符"
                    autoComplete="new-password"
                    className="w-full h-11 px-4 pr-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all [&::-ms-reveal]:hidden"
                    style={{ WebkitTextSecurity: showSetupPassword ? "none" : undefined } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showSetupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">确认密码</label>
                <input
                  type="password"
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Setup Error */}
              <AnimatePresence>
                {setupError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20"
                  >
                    {setupError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={setupSubmitting}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary-cyan text-white font-medium text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                >
                  {setupSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <ArrowRight size={18} />
                      创建管理员账号并开始使用
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center text-xs text-slate-600 mt-6"
          >
            设置完成后即可开始使用，首次创建的用户自动成为系统管理员
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ==================== NORMAL LOGIN ====================
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
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
            Chamiko<span className="gradient-text">Files</span>
          </h1>
          <p className="text-sm text-slate-500">私人云盘 - 登录</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border border-white/[0.06]">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
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
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
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
