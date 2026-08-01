"use client";

import { useState, useEffect } from "react";
import { AppConfig } from "@/types";
import { useToast } from "@/components/toast-provider";
import { useAuth } from "@/components/auth-provider";
import { StorageMigrateDialog, MigrateMode } from "@/components/storage-migrate-dialog";
import { motion } from "framer-motion";
import {
  Save, Folder, HardDrive, FileType, ArrowLeft, Check, ShieldOff, Loader2,
  Users, User, Gauge, Globe, Settings2, Upload, Shield, Bell, Info, Server,
  Cpu, Database, Calendar,
} from "lucide-react";
import Link from "next/link";

type TabKey = "storage" | "site-upload" | "security-notify";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "storage", label: "存储设置", icon: HardDrive },
  { key: "site-upload", label: "站点与上传", icon: Globe },
  { key: "security-notify", label: "安全与通知", icon: Shield },
];

export default function SettingsPage() {
  const { addToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("storage");

  // --- Storage fields ---
  const [storagePath, setStoragePath] = useState("");
  const [maxSpaceGB, setMaxSpaceGB] = useState("");
  const [allowedTypes, setAllowedTypes] = useState("");
  const [personalQuotaGB, setPersonalQuotaGB] = useState("");
  const [sharedQuotaGB, setSharedQuotaGB] = useState("");
  const [maxSharedSpaces, setMaxSharedSpaces] = useState("3");

  // --- Site fields ---
  const [siteName, setSiteName] = useState("");
  const [siteDesc, setSiteDesc] = useState("");

  // --- Upload fields ---
  const [maxFileSizeMB, setMaxFileSizeMB] = useState("");
  const [maxFilesPerBatch, setMaxFilesPerBatch] = useState("");

  // --- Security fields ---
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("");
  const [lockoutMinutes, setLockoutMinutes] = useState("");
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState("");

  // --- Notification fields ---
  const [storageAlertPercent, setStorageAlertPercent] = useState("");

  // Migration dialog state
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [migrateOldPath, setMigrateOldPath] = useState("");
  const [migrateNewPath, setMigrateNewPath] = useState("");
  const [pendingSave, setPendingSave] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.success) {
        const cfg: AppConfig = data.data;
        setConfig(cfg);
        // Storage
        const p = cfg.storage.path || "";
        const isAbs = /^[A-Za-z]:[\\/]/.test(p) || p.startsWith("/");
        setStoragePath(isAbs ? p : "");
        setMaxSpaceGB(cfg.storage.maxSpace > 0 ? (cfg.storage.maxSpace / 1073741824).toFixed(1) : "");
        setAllowedTypes(cfg.storage.allowedTypes);
        setPersonalQuotaGB(cfg.quota.defaultPersonalQuota > 0 ? (cfg.quota.defaultPersonalQuota / 1073741824).toFixed(1) : "");
        setSharedQuotaGB(cfg.quota.defaultSharedQuota > 0 ? (cfg.quota.defaultSharedQuota / 1073741824).toFixed(1) : "");
        setMaxSharedSpaces(String(cfg.quota.maxSharedSpaces));
        // Site
        setSiteName(cfg.site?.name || "ChamikoFiles");
        setSiteDesc(cfg.site?.description || "");
        // Upload
        setMaxFileSizeMB(cfg.upload?.maxFileSize > 0 ? (cfg.upload.maxFileSize / 1048576).toFixed(0) : "");
        setMaxFilesPerBatch(String(cfg.upload?.maxFilesPerBatch ?? 50));
        // Security
        setMaxLoginAttempts(String(cfg.security?.maxLoginAttempts ?? 5));
        setLockoutMinutes(String(cfg.security?.lockoutMinutes ?? 15));
        setSessionTimeoutHours(String(cfg.security?.sessionTimeoutHours ?? 168));
        // Notification
        setStorageAlertPercent(String(cfg.notification?.storageAlertPercent ?? 80));
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const buildPayload = (): Record<string, unknown> => {
    const maxSpaceBytes = maxSpaceGB && parseFloat(maxSpaceGB) > 0 ? Math.round(parseFloat(maxSpaceGB) * 1073741824) : 0;
    const personalBytes = personalQuotaGB && parseFloat(personalQuotaGB) > 0 ? Math.round(parseFloat(personalQuotaGB) * 1073741824) : -1;
    const sharedBytes = sharedQuotaGB && parseFloat(sharedQuotaGB) > 0 ? Math.round(parseFloat(sharedQuotaGB) * 1073741824) : -1;
    const maxSpaces = parseInt(maxSharedSpaces) || 3;
    const maxFileSizeBytes = maxFileSizeMB && parseFloat(maxFileSizeMB) > 0 ? Math.round(parseFloat(maxFileSizeMB) * 1048576) : 524288000;
    const batchCount = parseInt(maxFilesPerBatch) || 50;
    const attempts = parseInt(maxLoginAttempts) || 5;
    const lockMins = parseInt(lockoutMinutes) || 15;
    const sessionHrs = parseInt(sessionTimeoutHours) || 168;
    const alertPct = parseInt(storageAlertPercent) || 80;

    return {
      storage: { path: storagePath, maxSpace: maxSpaceBytes, allowedTypes },
      quota: { defaultPersonalQuota: personalBytes, defaultSharedQuota: sharedBytes, maxSharedSpaces: maxSpaces },
      site: { name: siteName, description: siteDesc },
      upload: { maxFileSize: maxFileSizeBytes, maxFilesPerBatch: batchCount },
      security: { maxLoginAttempts: attempts, lockoutMinutes: lockMins, sessionTimeoutHours: sessionHrs },
      notification: { storageAlertPercent: alertPct },
    };
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = buildPayload();

    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.success && data.pathChanged) {
      setMigrateOldPath(data.oldPath);
      setMigrateNewPath(data.newPath);
      setPendingSave(payload);
      setSaving(false);
      setMigrateOpen(true);
    } else if (data.success) {
      addToast("设置已保存", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setSaving(false);
    } else {
      addToast(data.error || "保存失败", "error");
      setSaving(false);
    }
  };

  const handleMigrate = async (mode: MigrateMode) => {
    if (!pendingSave) return;

    if (mode === "skip") {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingSave, _migrationHandled: true }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("设置已保存（已跳过文件迁移）", "success");
      } else {
        addToast(data.error || "保存失败", "error");
      }
    } else {
      const migrateRes = await fetch("/api/storage/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPath: migrateOldPath, newPath: migrateNewPath, mode }),
      });
      const migrateData = await migrateRes.json();

      if (migrateData.success) {
        const { totalFiles, migratedFiles, failedFiles } = migrateData.data;
        const res = await fetch("/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingSave, _migrationHandled: true }),
        });
        const data = await res.json();

        if (data.success) {
          if (failedFiles > 0) {
            addToast(`设置已保存，迁移完成：${migratedFiles}/${totalFiles} 个文件，${failedFiles} 个失败`, "info");
          } else {
            const action = mode === "move" ? "移动" : "复制";
            addToast(`设置已保存，已${action} ${migratedFiles} 个文件`, "success");
          }
        } else {
          addToast(data.error || "配置保存失败，但文件已迁移", "error");
        }
      } else {
        addToast(migrateData.error || "文件迁移失败", "error");
      }
    }

    setMigrateOpen(false);
    setPendingSave(null);
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

  // ---- Shared input classes ----
  const inputClass = "w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all";
  const inputSmallClass = "w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all";

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Link href="/" className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-all">
            <ArrowLeft size={16} className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">系统设置</h1>
            <p className="text-sm text-slate-500 mt-0.5">配置文件存储、站点信息、安全策略等参数</p>
          </div>
        </motion.div>

        {/* Tab bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/[0.04] inline-flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key
                  ? "bg-primary/20 text-primary-light shadow-sm"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* ============ TAB: 存储设置 ============ */}
        {activeTab === "storage" && (
          <div className="space-y-4">
            {/* Storage Path */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Folder size={18} className="text-primary-light" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">存储路径</h2><p className="text-xs text-slate-500">文件保存的目标文件夹，留空使用默认路径</p></div>
              </div>
              <input type="text" value={storagePath} onChange={(e) => setStoragePath(e.target.value)} placeholder="默认路径" className={inputClass} />
            </motion.div>

            {/* Global Space Limit */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center"><HardDrive size={18} className="text-primary-cyan" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">全局存储上限</h2><p className="text-xs text-slate-500">0 或留空表示不限制</p></div>
              </div>
              <div className="relative">
                <input type="number" min="0" step="0.1" value={maxSpaceGB} onChange={(e) => setMaxSpaceGB(e.target.value)} placeholder="不限制" className={inputClass + " pr-14"} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">GB</span>
              </div>
            </motion.div>

            {/* Allowed Types */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center"><FileType size={18} className="text-violet-400" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">允许的文件类型</h2><p className="text-xs text-slate-500">留空允许所有类型，用逗号分隔（如 .jpg,.png,.pdf）</p></div>
              </div>
              <input type="text" value={allowedTypes} onChange={(e) => setAllowedTypes(e.target.value)} placeholder="留空允许所有类型" className={inputClass} />
            </motion.div>

            {/* Quota Section */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Gauge size={18} className="text-emerald-400" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">空间配额</h2><p className="text-xs text-slate-500">-1 或留空表示不限制</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">默认个人空间容量</label>
                  <div className="relative">
                    <input type="number" min="-1" step="0.1" value={personalQuotaGB} onChange={(e) => setPersonalQuotaGB(e.target.value)} placeholder="不限制" className={inputSmallClass + " pr-14"} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">GB</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">默认共享空间容量</label>
                  <div className="relative">
                    <input type="number" min="-1" step="0.1" value={sharedQuotaGB} onChange={(e) => setSharedQuotaGB(e.target.value)} placeholder="不限制" className={inputSmallClass + " pr-14"} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">GB</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">每人最多共享空间数</label>
                  <input type="number" min="1" max="10" value={maxSharedSpaces} onChange={(e) => setMaxSharedSpaces(e.target.value)} className={inputSmallClass} />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ============ TAB: 站点与上传 ============ */}
        {activeTab === "site-upload" && (
          <div className="space-y-4">
            {/* Site Info */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center"><Globe size={18} className="text-cyan-400" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">站点信息</h2><p className="text-xs text-slate-500">自定义站点名称和描述</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">站点名称</label>
                  <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="ChamikoFiles" className={inputSmallClass} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">站点描述</label>
                  <input type="text" value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} placeholder="私人云盘" className={inputSmallClass} />
                </div>
              </div>
            </motion.div>

            {/* Upload Limits */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><Upload size={18} className="text-blue-400" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">上传限制</h2><p className="text-xs text-slate-500">控制单文件和批量上传的行为</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">单个文件最大大小</label>
                  <div className="relative">
                    <input type="number" min="1" step="1" value={maxFileSizeMB} onChange={(e) => setMaxFileSizeMB(e.target.value)} placeholder="500" className={inputSmallClass + " pr-14"} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">MB</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">默认 500 MB</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">单次批量上传最大文件数</label>
                  <input type="number" min="1" max="200" value={maxFilesPerBatch} onChange={(e) => setMaxFilesPerBatch(e.target.value)} placeholder="50" className={inputSmallClass} />
                  <p className="text-[11px] text-slate-600 mt-1">默认 50 个</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ============ TAB: 安全与通知 ============ */}
        {activeTab === "security-notify" && (
          <div className="space-y-4">
            {/* Security */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Shield size={18} className="text-amber-400" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">安全设置</h2><p className="text-xs text-slate-500">登录安全策略与会话管理</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">登录失败锁定次数</label>
                  <input type="number" min="1" max="20" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} placeholder="5" className={inputSmallClass} />
                  <p className="text-[11px] text-slate-600 mt-1">连续登录失败达到此次数后锁定账号（默认 5 次）</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">锁定时长</label>
                  <div className="relative">
                    <input type="number" min="1" max="1440" value={lockoutMinutes} onChange={(e) => setLockoutMinutes(e.target.value)} placeholder="15" className={inputSmallClass + " pr-20"} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">分钟</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">账号被锁定后的自动解锁时间（默认 15 分钟）</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">会话超时时间</label>
                  <div className="relative">
                    <input type="number" min="1" max="720" value={sessionTimeoutHours} onChange={(e) => setSessionTimeoutHours(e.target.value)} placeholder="168" className={inputSmallClass + " pr-20"} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">小时</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">登录后无操作自动登出的时间（默认 168 小时 / 7 天）</p>
                </div>
              </div>
            </motion.div>

            {/* Notification */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Bell size={18} className="text-emerald-400" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">通知设置</h2><p className="text-xs text-slate-500">存储空间告警阈值</p></div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">存储告警阈值</label>
                <div className="relative">
                  <input type="number" min="1" max="100" value={storageAlertPercent} onChange={(e) => setStorageAlertPercent(e.target.value)} placeholder="80" className={inputSmallClass + " pr-10"} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">%</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">当存储空间使用率达到此百分比时发出告警（默认 80%）</p>
              </div>
            </motion.div>

            {/* About */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-500/10 flex items-center justify-center"><Info size={18} className="text-slate-400" /></div>
                <div><h2 className="text-sm font-semibold text-slate-200">关于系统</h2><p className="text-xs text-slate-500">ChamikoFiles 版本与运行信息</p></div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Server size={13} className="text-slate-500" />
                  <span className="text-slate-500 text-xs">系统版本</span>
                </div>
                <span className="text-slate-300 text-xs text-right font-mono">v1.0.0</span>

                <div className="flex items-center gap-2">
                  <Database size={13} className="text-slate-500" />
                  <span className="text-slate-500 text-xs">数据库路径</span>
                </div>
                <span className="text-slate-300 text-xs text-right font-mono truncate">data/</span>

                <div className="flex items-center gap-2">
                  <Settings2 size={13} className="text-slate-500" />
                  <span className="text-slate-500 text-xs">配置文件</span>
                </div>
                <span className="text-slate-300 text-xs text-right font-mono truncate">config.ini</span>

                <div className="flex items-center gap-2">
                  <Cpu size={13} className="text-slate-500" />
                  <span className="text-slate-500 text-xs">运行环境</span>
                </div>
                <span className="text-slate-300 text-xs text-right font-mono">Next.js 14</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Save button */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex justify-end mt-6">
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

      {/* Migration dialog */}
      <StorageMigrateDialog
        open={migrateOpen}
        oldPath={migrateOldPath}
        newPath={migrateNewPath}
        onMigrate={handleMigrate}
        onClose={() => { setMigrateOpen(false); setPendingSave(null); }}
      />
    </>
  );
}
