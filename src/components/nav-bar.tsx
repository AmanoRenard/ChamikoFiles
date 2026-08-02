"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, Settings, Shield, User, Menu } from "lucide-react";
import { StorageRing } from "./storage-ring";
import { MobileDrawer } from "./mobile-drawer";
import { UserProfilePopup } from "./user-profile-popup";
import { formatFileSize } from "@/lib/file-utils";
import { StorageStats } from "@/types";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth-provider";

interface NavBarProps {
  initialSiteName?: string;
  initialSiteDesc?: string;
  initialSmartGradient?: boolean;
}

export function NavBar({ initialSiteName = "ChamikoFiles", initialSiteDesc = "私人云盘", initialSmartGradient = true }: NavBarProps = {}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const userAreaRef = useRef<HTMLButtonElement>(null);
  const [siteName, setSiteName] = useState(initialSiteName);
  const [siteDesc, setSiteDesc] = useState(initialSiteDesc);
  const [smartGradient, setSmartGradient] = useState(initialSmartGradient);

  useEffect(() => {
    fetch("/api/config/site")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSiteName(d.data.name || "ChamikoFiles");
          setSiteDesc(d.data.description || "私人云盘");
          setSmartGradient(d.data.smartGradient ?? true);
        }
      })
      .catch(() => {});
  }, []);

  /** 智能拆分站点名称：找到最后一个大写字母位置，把后面的部分应用渐变 */
  const splitGradientName = (name: string) => {
    // 找到最后一个大写字母（非首字母）的位置
    for (let i = name.length - 1; i >= 1; i--) {
      if (name[i] >= "A" && name[i] <= "Z") {
        return { prefix: name.slice(0, i), gradient: name.slice(i) };
      }
    }
    // 找不到第二个大写字母，整体渐变
    return { prefix: "", gradient: name };
  };

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await fetch("/api/storage", { credentials: "include" });
        if (!res.ok) return;
        // 检查 Content-Type 防止把 HTML 登录页当 JSON 解析
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch {
        // 请求失败或响应非 JSON，静默忽略
      }
    };
    fetchStorage();
    const interval = setInterval(fetchStorage, 10000);
    return () => clearInterval(interval);
  }, []);

  const isAuthPage =
    typeof window !== "undefined" &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/register");

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-surface-dark/60 backdrop-blur-xl select-none">
        <div className="w-full px-4 sm:px-6 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group" draggable={false}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-cyan flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow" draggable={false}>
                <Cloud size={18} className="text-white" />
              </div>
              <div>
                {smartGradient ? (() => {
                  const { prefix, gradient } = splitGradientName(siteName);
                  return (
                    <h1 className="text-base font-bold text-slate-100 tracking-tight">
                      {prefix}
                      <span className="gradient-text">{gradient}</span>
                    </h1>
                  );
                })() : (
                  <h1 className="text-base font-bold text-slate-100 tracking-tight">
                    {siteName}
                  </h1>
                )}
                <p className="text-[10px] text-slate-500 -mt-0.5">{siteDesc}</p>
              </div>
            </Link>

            {/* Right section — desktop */}
            <div className="hidden sm:flex items-center gap-3">
              {user && stats && (
                <StorageRing
                  usagePercent={stats.usagePercent}
                  fileCount={stats.fileCount}
                  usedSpace={formatFileSize(stats.usedSpace)}
                  maxSpace={stats.maxSpace > 0 ? formatFileSize(stats.maxSpace) : "无限"}
                />
              )}

              {/* User section — only when logged in and not on auth pages */}
              {user && !isAuthPage && (
                <>
                  {/* Admin link */}
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary-light hover:bg-primary/20 transition-all"
                      title="用户管理"
                      draggable={false}
                    >
                      <Shield size={13} />
                      管理
                    </Link>
                  )}

                  {/* User avatar + name */}
                  <div className="relative">
                    <button
                      ref={userAreaRef}
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08] transition-all cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.nickname || user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={12} className={user.isAdmin ? "text-primary-light" : "text-slate-400"} />
                        )}
                      </div>
                      <span className="text-xs text-slate-300 max-w-[80px] truncate">
                        {user.nickname || user.username}
                      </span>
                    </button>

                    <UserProfilePopup
                      open={profileOpen}
                      onClose={() => setProfileOpen(false)}
                      anchorRef={userAreaRef}
                    />
                  </div>
                </>
              )}

              {user && user.isAdmin && (
                <Link
                  href="/settings"
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-all"
                  title="设置"
                  draggable={false}
                >
                  <Settings size={15} className="text-slate-400" />
                </Link>
              )}
            </div>

            {/* Right section — mobile: hamburger menu button */}
            {user && !isAuthPage && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="sm:hidden w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-all"
                title="菜单"
              >
                <Menu size={18} className="text-slate-300" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
