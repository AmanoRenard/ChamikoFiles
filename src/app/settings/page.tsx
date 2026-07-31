"use client";

import { useState, useEffect } from "react";
import { AppConfig } from "@/types";
import { useToast } from "@/components/toast-provider";
import { useAuth } from "@/components/auth-provider";
import { motion } from "framer-motion";
import {
  Save, Folder, HardDrive, FileType, ArrowLeft, Check, ShieldOff, Loader2,
  Users, User, Gauge,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { addToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [storagePath, setStoragePath] = useState("");
  const [maxSpaceGB, setMaxSpaceGB] = useState("");
  const [allowedTypes, setAllowedTypes] = useState("");
  const [personalQuotaGB, setPersonalQuotaGB] = useState("");
  const [sharedQuotaGB, setSharedQuotaGB] = useState("");
  const [maxSharedSpaces, setMaxSharedSpaces] = useState("3");

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.success) {
        const cfg: AppConfig = data.data;
        setConfig(cfg);
        setStoragePath(cfg.storage.path);
        setMaxSpaceGB(cfg.storage.maxSpace > 0 ? (cfg.storage.maxSpace / 1073741824).toFixed(1) : "");
        setAllowedTypes(cfg.storage.allowedTypes);
        setPersonalQuotaGB(cfg.quota.defaultPersonalQuota > 0 ? (cfg.quota.defaultPersonalQuota / 1073741824).toFixed(1) : "");
        setSharedQuotaGB(cfg.quota.defaultSharedQuota > 0 ? (cfg.quota.defaultSharedQuota / 1073741824).toFixed(1) : "");
        setMaxSharedSpaces(String(cfg.quota.maxSharedSpaces));
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const maxSpaceBytes = maxSpaceGB && parseFloat(maxSpaceGB) > 0 ? Math.round(parseFloat(maxSpaceGB) * 1073741824) : 0;
    const personalBytes = personalQuotaGB && parseFloat(personalQuotaGB) > 0 ? Math.round(parseFloat(personalQuotaGB) * 1073741824) : -1;
    const sharedBytes = sharedQuotaGB && parseFloat(sharedQuotaGB) > 0 ? Math.round(parseFloat(sharedQuotaGB) * 1073741824) : -1;
    const maxSpaces = parseInt(maxSharedSpaces) || 3;

    const partial: Record<string, unknown> = {
      storage: { path: storagePath, maxSpace: maxSpaceBytes, allowedTypes },
      quota: { defaultPersonalQuota: personalBytes, defaultSharedQuota: sharedBytes, maxSharedSpaces: maxSpaces },
    };

    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const data = await res.json();

    if (data.success) {
      addToast("设置已保存", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      addToast(data.error || "保存失败", "error");
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 top-16 flex items-center justify-center z-50">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="fixed inset-0 top-16 flex items-center justify-center px-4 z-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-10 text-center max-w-lg w-full">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-200 mb-2">权限不足</h2>
          <p className="text-sm text-slate-500 mb-6">系统设置仅限管理员访问</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300 hover:bg-white/[0.08] transition-all">
            <ArrowLeft size={14} /> 返回首页
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
        <Link href="/" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-all">
          <ArrowLeft size={16} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">系统设置</h1>
          <p className="text-sm text-slate-500 mt-0.5">配置文件存储和配额参数</p>
        </div>
      </motion.div>

      {/* Storage Path */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Folder size={18} className="text-primary-light" /></div>
          <div><h2 className="text-sm font-semibold text-slate-200">存储路径</h2><p className="text-xs text-slate-500">文件保存的目标文件夹</p></div>
        </div>
        <input type="text" value={storagePath} onChange={(e) => setStoragePath(e.target.value)} placeholder="例如: C:\Users\Chamiko\Downloads" className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all" />
      </motion.div>

      {/* Global Space Limit */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center"><HardDrive size={18} className="text-primary-cyan" /></div>
          <div><h2 className="text-sm font-semibold text-slate-200">全局存储上限</h2><p className="text-xs text-slate-500">0 或留空表示不限制</p></div>
        </div>
        <div className="relative">
          <input type="number" min="0" step="0.1" value={maxSpaceGB} onChange={(e) => setMaxSpaceGB(e.target.value)} placeholder="不限制" className="w-full h-11 px-4 pr-14 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">GB</span>
        </div>
      </motion.div>

      {/* Allowed Types */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center"><FileType size={18} className="text-violet-400" /></div>
          <div><h2 className="text-sm font-semibold text-slate-200">允许的文件类型</h2><p className="text-xs text-slate-500">留空允许所有类型，用逗号分隔（如 .jpg,.png,.pdf）</p></div>
        </div>
        <input type="text" value={allowedTypes} onChange={(e) => setAllowedTypes(e.target.value)} placeholder="留空允许所有类型" className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all" />
      </motion.div>

      {/* Quota Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Gauge size={18} className="text-emerald-400" /></div>
          <div><h2 className="text-sm font-semibold text-slate-200">空间配额</h2><p className="text-xs text-slate-500">-1 或留空表示不限制</p></div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">默认个人空间容量</label>
            <div className="relative">
              <input type="number" min="-1" step="0.1" value={personalQuotaGB} onChange={(e) => setPersonalQuotaGB(e.target.value)} placeholder="不限制" className="w-full h-10 px-4 pr-14 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">GB</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">默认共享空间容量</label>
            <div className="relative">
              <input type="number" min="-1" step="0.1" value={sharedQuotaGB} onChange={(e) => setSharedQuotaGB(e.target.value)} placeholder="不限制" className="w-full h-10 px-4 pr-14 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">GB</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">每人最多共享空间数</label>
            <input type="number" min="1" max="10" value={maxSharedSpaces} onChange={(e) => setMaxSharedSpaces(e.target.value)} className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 focus:outline-none focus:border-primary/40 transition-all" />
          </div>
        </div>
      </motion.div>

      {/* Save */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-end">
        <button
          onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                  : "bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
          }`}
        >
          {saved ? (<><Check size={16} />已保存</>) : saving ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</>) : (<><Save size={16} />保存设置</>)}
        </button>
      </motion.div>
    </div>
  );
}
