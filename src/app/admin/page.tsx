"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, RefreshCw, Loader2, Clock, Check, KeyRound,
  Users, Shield, User, HardDrive,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { ApiResponse, User as UserType, InviteInfo, UserQuota, SharedSpace } from "@/types";
import { formatDate } from "@/lib/file-utils";

type Tab = "users" | "quotas" | "spaces";

export default function AdminPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const remainingRef = useRef(0);
  const [users, setUsers] = useState<UserType[]>([]);
  const [quotas, setQuotas] = useState<UserQuota[]>([]);
  const [allSpaces, setAllSpaces] = useState<SharedSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [editingQuota, setEditingQuota] = useState<{ userId: number; value: string } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [invRes, usrRes, quotaRes] = await Promise.all([
      fetch("/api/admin/invite"),
      fetch("/api/admin/users"),
      fetch("/api/admin/quotas").catch(() => null),
    ]);

    const invData: ApiResponse<InviteInfo> = await invRes.json();
    const usrData: ApiResponse<UserType[]> = await usrRes.json();

    if (invData.success) {
      setInvite(invData.data || null);
      if (invData.data) remainingRef.current = invData.data.remainingSeconds;
    }
    if (usrData.success && usrData.data) setUsers(usrData.data);

    if (quotaRes) {
      const quotaData: ApiResponse<UserQuota[]> = await quotaRes.json();
      if (quotaData.success && quotaData.data) setQuotas(quotaData.data);
    }

    // Fetch all shared spaces
    try {
      const spacesRes = await fetch("/api/admin/spaces");
      const spacesData: ApiResponse<SharedSpace[]> = await spacesRes.json();
      if (spacesData.success && spacesData.data) setAllSpaces(spacesData.data);
    } catch {
      // ignore
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!invite) return;
    remainingRef.current = invite.remainingSeconds;
    const update = () => {
      const remaining = Math.max(0, remainingRef.current - 1);
      remainingRef.current = remaining;
      if (remaining <= 0) { setCountdown("已过期"); return; }
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      setCountdown(`${h}时${m}分`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [invite]);

  const handleGenerate = async () => {
    setGenerating(true);
    const res = await fetch("/api/admin/invite", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setInvite(data.data);
      remainingRef.current = data.data.remainingSeconds;
    }
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveQuota = async (userId: number, gbValue: string) => {
    const bytes = parseFloat(gbValue) > 0 ? Math.round(parseFloat(gbValue) * 1073741824) : -1;
    try {
      const res = await fetch("/api/admin/quotas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, personalSpaceMaxBytes: bytes }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("配额已更新", "success");
        setQuotas((prev) => {
          const idx = prev.findIndex((q) => q.userId === userId);
          const updated = { userId, username: data.data.username, personalSpaceMaxBytes: bytes };
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
      } else {
        addToast(data.error || "更新失败", "error");
      }
    } catch {
      addToast("网络错误", "error");
    }
    setEditingQuota(null);
  };

  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 top-16 flex items-center justify-center z-50">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col relative overflow-y-auto overflow-x-hidden lg:overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F0B1E] via-[#1A1530] to-[#0F0B1E]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-all">
            <ArrowLeft size={16} className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">管理控制台</h1>
            <p className="text-xs text-slate-500">管理员面板</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white/[0.03] rounded-xl p-1 border border-white/[0.04] inline-flex">
          {(["users", "quotas", "spaces"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t ? "bg-primary/20 text-primary-light" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {t === "users" ? "用户管理" : t === "quotas" ? "配额管理" : "空间概览"}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-card p-6 border border-white/[0.06]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><KeyRound size={16} className="text-primary-light" /></div>
                  <h2 className="text-sm font-semibold text-slate-200">注册邀请码</h2>
                </div>
                {invite ? (
                  <div className="space-y-4">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-2">当前有效邀请码</p>
                      <div className="flex items-center gap-2">
                        <code className="text-2xl font-bold text-primary-light tracking-[0.3em] select-all">{invite.code}</code>
                        <button onClick={handleCopy} className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-all flex-shrink-0">
                          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-slate-400" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Clock size={14} className="text-amber-400" />
                      <span className="text-xs text-amber-300">{countdown ? `剩余 ${countdown}` : "计算中..."}</span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>有效期 24 小时，生成新码后旧码自动失效</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-6 text-slate-500">
                      <KeyRound size={32} className="mx-auto mb-2 text-slate-600" />
                      <p className="text-sm">暂无有效邀请码</p>
                    </div>
                  </div>
                )}
                <button onClick={handleGenerate} disabled={generating} className="w-full h-10 rounded-xl bg-gradient-to-r from-primary to-primary-cyan text-white text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 mt-4">
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {invite ? "生成新邀请码（旧码将失效）" : "生成邀请码"}
                </button>
              </div>
            </div>
            <div className="lg:col-span-3 flex flex-col overflow-hidden">
              <div className="glass-card p-6 border border-white/[0.06] flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center gap-2.5 mb-4 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center"><Users size={16} className="text-cyan-400" /></div>
                  <h2 className="text-sm font-semibold text-slate-200">用户列表 <span className="text-slate-500 font-normal ml-1">({users.length}人)</span></h2>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.04]">
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">用户名</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">角色</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 hidden sm:table-cell">注册时间</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 hidden md:table-cell">最后登录</th>
                    </tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3"><div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
                              <User size={14} className={u.isAdmin ? "text-primary-light" : "text-slate-500"} />
                            </div>
                            <span className="text-slate-300 font-medium">{u.username}</span>
                          </div></td>
                          <td className="py-3 px-3">{u.isAdmin ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/20 border border-primary/20 text-xs text-primary-light"><Shield size={10} />管理员</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/20 text-xs text-slate-400">用户</span>}</td>
                          <td className="py-3 px-3 text-slate-500 text-xs hidden sm:table-cell">{formatDate(u.createdAt)}</td>
                          <td className="py-3 px-3 text-slate-500 text-xs hidden md:table-cell">{u.lastLogin ? formatDate(u.lastLogin) : "从未登录"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quotas Tab */}
        {tab === "quotas" && (
          <div className="glass-card p-6 border border-white/[0.06]">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><HardDrive size={16} className="text-emerald-400" /></div>
              <h2 className="text-sm font-semibold text-slate-200">用户配额管理</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">设置每个用户的个人空间容量上限，-1 表示不限制</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.04]">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">用户名</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">个人空间配额 (GB)</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">操作</th>
                </tr></thead>
                <tbody>
                  {users.filter((u) => !u.isAdmin).map((u) => {
                    const quota = quotas.find((q) => q.userId === u.id);
                    const currentGB = quota && quota.personalSpaceMaxBytes > 0
                      ? (quota.personalSpaceMaxBytes / 1073741824).toFixed(1)
                      : "不限";
                    const editing = editingQuota?.userId === u.id;

                    return (
                      <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                        <td className="py-3 px-3 text-slate-300">{u.username}</td>
                        <td className="py-3 px-3">
                          {editing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min="-1" step="0.1"
                                value={editingQuota!.value}
                                onChange={(e) => setEditingQuota({ userId: u.id, value: e.target.value })}
                                className="w-20 h-8 px-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-slate-200 focus:outline-none focus:border-primary/40 text-center"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveQuota(u.id, editingQuota!.value);
                                  if (e.key === "Escape") setEditingQuota(null);
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-slate-400">{currentGB}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {editing ? (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleSaveQuota(u.id, editingQuota!.value)} className="px-3 py-1 rounded-lg bg-primary/20 text-xs text-primary-light hover:bg-primary/30 transition-all">保存</button>
                              <button onClick={() => setEditingQuota(null)} className="px-3 py-1 rounded-lg bg-white/[0.04] text-xs text-slate-400 hover:bg-white/[0.08] transition-all">取消</button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingQuota({ userId: u.id, value: currentGB === "不限" ? "-1" : currentGB })} className="px-3 py-1 rounded-lg bg-white/[0.04] text-xs text-slate-400 hover:bg-white/[0.08] transition-all">编辑</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {users.filter((u) => !u.isAdmin).length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-500 text-sm">暂无普通用户</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Spaces Tab */}
        {tab === "spaces" && (
          <div className="glass-card p-6 border border-white/[0.06]">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center"><Users size={16} className="text-violet-400" /></div>
              <h2 className="text-sm font-semibold text-slate-200">共享空间列表 <span className="text-slate-500 font-normal ml-1">({allSpaces.length}个)</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.04]">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">空间名称</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">成员数</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 hidden sm:table-cell">创建时间</th>
                </tr></thead>
                <tbody>
                  {allSpaces.map((s) => (
                    <tr key={s.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="py-3 px-3 text-slate-300">{s.name}</td>
                      <td className="py-3 px-3 text-slate-400">{s.memberCount}</td>
                      <td className="py-3 px-3 text-slate-500 text-xs hidden sm:table-cell">{formatDate(s.createdAt)}</td>
                    </tr>
                  ))}
                  {allSpaces.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-500 text-sm">暂无共享空间</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
