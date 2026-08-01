"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  User,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { StorageRing } from "./storage-ring";
import { useAuth } from "@/components/auth-provider";
import { useScrollLock } from "@/hooks/useScrollLock";
import { formatFileSize } from "@/lib/file-utils";
import { StorageStats } from "@/types";
import Link from "next/link";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<StorageStats | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open || !user) return;
    const fetchStorage = async () => {
      try {
        const res = await fetch("/api/storage", { credentials: "include" });
        if (!res.ok) return;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch {
        // 请求失败或响应非 JSON，静默忽略
      }
    };
    fetchStorage();
  }, [open, user]);

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push("/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm sm:hidden"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-[110] w-72 max-w-[85vw] bg-surface-dark border-l border-white/[0.08] shadow-2xl sm:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-slate-200">菜单</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-all"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* User info */}
                {user && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <User size={20} className={user.isAdmin ? "text-primary-light" : "text-slate-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {user.username}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user.isAdmin ? "管理员" : "用户"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Storage info — inline layout like desktop */}
                {stats && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
                    <StorageRing
                      usagePercent={stats.usagePercent}
                      fileCount={stats.fileCount}
                      usedSpace={formatFileSize(stats.usedSpace)}
                      maxSpace={stats.maxSpace > 0 ? formatFileSize(stats.maxSpace) : "无限"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">
                        已用 {formatFileSize(stats.usedSpace)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {stats.maxSpace > 0 ? formatFileSize(stats.maxSpace) : "无限"} · {stats.fileCount} 个文件
                      </p>
                    </div>
                  </div>
                )}

                {/* Nav links */}
                <div className="space-y-1">
                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield size={15} className="text-primary-light" />
                      </div>
                      <span className="text-sm text-slate-300 flex-1">用户管理</span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </Link>
                  )}
                  {user?.isAdmin && (
                    <Link
                      href="/settings"
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                        <Settings size={15} className="text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-300 flex-1">系统设置</span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Footer: Logout */}
              <div className="px-5 py-4 border-t border-white/[0.06]">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <LogOut size={15} className="text-red-400" />
                  </div>
                  <span className="text-sm text-red-400">退出登录</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
