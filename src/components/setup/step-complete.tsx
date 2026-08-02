"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Globe,
  FileText,
  FolderOpen,
  Upload,
  HardDrive,
  ShieldAlert,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface AdminData {
  username: string;
  nickname: string;
  password: string;
  confirmPassword: string;
}

interface SiteData {
  name: string;
  description: string;
  storagePath: string;
}

interface SecurityData {
  maxFileSize: number;
  maxSpace: number;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

interface Props {
  adminData: AdminData;
  siteData: SiteData;
  securityData: SecurityData;
  submitting: boolean;
  onFinish: () => void;
  onPrev: () => void;
}

function formatBytes(mb: number): string {
  if (mb === -1) return "无限制";
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

function formatSpace(gb: number): string {
  if (gb === -1) return "无限制";
  return `${gb} GB`;
}

export default function StepComplete({
  adminData,
  siteData,
  securityData,
  submitting,
  onFinish,
  onPrev,
}: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (submitting) {
      // Fast progress to 90%, then hold until actual completion
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const increment = prev < 30 ? 2 : prev < 60 ? 1.5 : prev < 80 ? 0.8 : 0.3;
          return Math.min(90, prev + increment);
        });
      }, 50);
      return () => clearInterval(timer);
    } else {
      setProgress(100);
    }
  }, [submitting]);

  const summaryItems = [
    {
      icon: Globe,
      label: "站点名称",
      value: siteData.name || "ChamikoFiles",
      color: "text-cyan-400",
    },
    {
      icon: FileText,
      label: "站点描述",
      value: siteData.description || "私人云盘",
      color: "text-slate-400",
    },
    {
      icon: FolderOpen,
      label: "文件存放目录",
      value: (siteData.storagePath || "默认路径 (C:/Users/Public/Chamiko/Chamiko Files)").replace(/\\/g, "/"),
      color: "text-amber-400",
    },
    {
      icon: Upload,
      label: "单文件大小上限",
      value: formatBytes(securityData.maxFileSize),
      color: "text-primary-light",
    },
    {
      icon: HardDrive,
      label: "总存储空间上限",
      value: formatSpace(securityData.maxSpace),
      color: "text-emerald-400",
    },
    {
      icon: ShieldAlert,
      label: "最大登录尝试",
      value: `${securityData.maxLoginAttempts} 次`,
      color: "text-red-400",
    },
    {
      icon: Clock,
      label: "会话超时",
      value: `${securityData.sessionTimeout} 小时`,
      color: "text-slate-400",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success icon */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <motion.div
            className="relative w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400/30 flex items-center justify-center"
            animate={
              !submitting
                ? {
                    boxShadow: [
                      "0 0 0 0 rgba(34, 197, 94, 0.3)",
                      "0 0 0 15px rgba(34, 197, 94, 0)",
                      "0 0 0 0 rgba(34, 197, 94, 0)",
                    ],
                  }
                : {}
            }
            transition={
              !submitting
                ? { repeat: Infinity, duration: 2, ease: "easeOut" }
                : {}
            }
          >
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
            >
              <CheckCircle2 size={40} className="text-emerald-400" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-slate-100 mb-1">
            {submitting ? "正在创建你的系统..." : "系统配置完成"}
          </h2>
          <p className="text-sm text-slate-500">
            {submitting
              ? "请稍候，正在初始化管理员账号和应用配置"
              : "你的私人云盘已准备就绪"}
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                progress >= 100
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-r from-primary to-primary-cyan"
              }`}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={
                progress === 100
                  ? { duration: 0.5, ease: "easeOut" }
                  : { duration: 0.3 }
              }
            />
          </div>
          <p className="text-[11px] text-slate-500 text-right mt-1">
            {Math.round(progress)}%
          </p>
        </motion.div>

        {/* Summary */}
        <motion.div
          className="glass-card p-5 border border-white/[0.06] space-y-3 mb-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs font-medium text-slate-500 mb-1">配置摘要</p>
          {summaryItems.map((item, index) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.06 }}
            >
              <item.icon size={14} className={item.color + " flex-shrink-0"} />
              <span className="text-xs text-slate-500 flex-shrink-0 w-24">
                {item.label}
              </span>
              <span className="text-xs text-slate-300 truncate">
                {item.value}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: submitting ? 0.5 : 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {/* Back button */}
          {!submitting && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-slate-400 hover:text-slate-200 hover:border-white/[0.15] transition-all"
            >
              <ArrowLeft size={16} />
              返回修改
            </button>
          )}

          {/* Enter button */}
          <button
            onClick={onFinish}
            disabled={submitting}
            className="group relative inline-flex items-center gap-3 px-10 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <span>进入系统</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <ArrowRight size={18} />
                </motion.span>
                {/* Pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-emerald-400/40"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
