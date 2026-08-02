"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Shield,
  User,
  UserCircle,
  Lock,
  KeyRound,
  Check,
  X,
} from "lucide-react";

interface AdminData {
  username: string;
  nickname: string;
  password: string;
  confirmPassword: string;
}

interface Props {
  data: AdminData;
  onChange: (data: AdminData) => void;
  error: string;
}

/** 密码需至少8位，且至少包含字母、数字、特殊字符中的两种 */
function checkPasswordValid(pwd: string): boolean {
  if (pwd.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/.test(pwd);
  return [hasLetter, hasDigit, hasSpecial].filter(Boolean).length >= 2;
}

type PasswordStrength = "empty" | "weak" | "medium" | "strong";

function getStrength(pwd: string): PasswordStrength {
  if (!pwd) return "empty";
  if (pwd.length < 8) return "weak";
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/.test(pwd);
  const count = [hasLetter, hasDigit, hasSpecial].filter(Boolean).length;
  if (pwd.length >= 10 && count === 3) return "strong";
  if (pwd.length >= 8 && count >= 2) return "medium";
  return "weak";
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  empty: { label: "", color: "bg-white/5", width: "0%" },
  weak: { label: "弱", color: "bg-red-500", width: "33%" },
  medium: { label: "中等", color: "bg-yellow-500", width: "66%" },
  strong: { label: "强", color: "bg-emerald-500", width: "100%" },
};

export default function StepAdminAccount({ data, onChange, error }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = getStrength(data.password);
  const strengthInfo = strengthConfig[strength];
  const confirmMatch = data.confirmPassword && data.password === data.confirmPassword;
  const confirmMismatch = data.confirmPassword && data.password !== data.confirmPassword;

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          >
            <Shield size={22} className="text-primary-light" />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">创建管理员账号</h2>
          <p className="text-sm text-slate-500">
            此账号将拥有系统的最高管理权限
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-6 border border-white/[0.06] space-y-4">
          {/* Username */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <User size={13} />
              用户名
            </label>
            <input
              type="text"
              value={data.username}
              onChange={(e) => onChange({ ...data, username: e.target.value })}
              placeholder="2-32 个字符"
              autoComplete="username"
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <UserCircle size={13} />
              昵称
            </label>
            <input
              type="text"
              value={data.nickname}
              onChange={(e) => onChange({ ...data, nickname: e.target.value })}
              placeholder="输入显示昵称"
              autoComplete="nickname"
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
                value={data.password}
                onChange={(e) => onChange({ ...data, password: e.target.value })}
                placeholder="至少 8 个字符"
                autoComplete="new-password"
                className="w-full h-11 px-4 pr-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
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
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Password strength bar */}
            {data.password && (
              <motion.div
                className="mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${strengthInfo.color}`}
                    initial={{ width: "0%" }}
                    animate={{ width: strengthInfo.width }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p
                  className="text-[11px] mt-1"
                  style={{ color: strengthInfo.color.replace("bg-", "").includes("red") ? "#EF4444" : strengthInfo.color.replace("bg-", "").includes("yellow") ? "#F59E0B" : "#22C55E" }}
                >
                  密码强度：{strengthInfo.label}
                  <span className="text-slate-600 ml-1">
                    {strength === "weak" && "（需至少8位，含字母+数字/符号）"}
                    {strength === "medium" && "（可用）"}
                    {strength === "strong" && "（安全性高）"}
                  </span>
                </p>
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
              <KeyRound size={13} />
              确认密码
            </label>
            <div className="relative">
              <input
                type="password"
                value={data.confirmPassword}
                onChange={(e) => onChange({ ...data, confirmPassword: e.target.value })}
                placeholder="再次输入密码"
                autoComplete="new-password"
                className="w-full h-11 px-4 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all [&::-ms-reveal]:hidden"
              />
              {data.confirmPassword && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {confirmMatch ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <X size={16} className="text-red-400" />
                  )}
                </span>
              )}
            </div>
            {confirmMismatch && (
              <motion.p
                className="text-[11px] text-red-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                两次密码输入不一致
              </motion.p>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-500/20"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
