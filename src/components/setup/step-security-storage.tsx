"use client";

import { motion } from "framer-motion";
import {
  HardDrive,
  Upload,
  ShieldAlert,
  Clock,
} from "lucide-react";

interface SecurityData {
  maxFileSize: number;
  maxSpace: number;
  maxLoginAttempts: number;
  sessionTimeout: number;
}

interface Props {
  data: SecurityData;
  onChange: (data: SecurityData) => void;
}

const FILE_SIZE_PRESETS = [
  { label: "100MB", value: 100 },
  { label: "500MB", value: 500 },
  { label: "1GB", value: 1024 },
  { label: "2GB", value: 2048 },
  { label: "无限制", value: -1 },
];

const SPACE_PRESETS = [
  { label: "5GB", value: 5 },
  { label: "10GB", value: 10 },
  { label: "50GB", value: 50 },
  { label: "100GB", value: 100 },
  { label: "无限制", value: -1 },
];

export default function StepSecurityStorage({ data, onChange }: Props) {
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
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          >
            <ShieldAlert size={22} className="text-amber-400" />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">安全与存储策略</h2>
          <p className="text-sm text-slate-500">配置上传限制和安全参数</p>
        </div>

        {/* Form */}
        <div className="glass-card p-6 border border-white/[0.06] space-y-5">
          {/* Max File Size */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
              <Upload size={13} />
              单文件大小上限
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={data.maxFileSize === -1 ? "" : data.maxFileSize}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...data, maxFileSize: v === "" ? -1 : Math.max(1, Number(v)) });
                }}
                placeholder="无限制"
                min={1}
                className="w-24 h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 text-center focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              <span className="text-xs text-slate-500">MB</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILE_SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ ...data, maxFileSize: preset.value })}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    data.maxFileSize === preset.value
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                      : "bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Space */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
              <HardDrive size={13} />
              总存储空间上限
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={data.maxSpace === -1 ? "" : data.maxSpace}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({ ...data, maxSpace: v === "" ? -1 : Math.max(0, Number(v)) });
                }}
                placeholder="无限制"
                min={0}
                className="w-24 h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 text-center focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              <span className="text-xs text-slate-500">GB</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SPACE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ ...data, maxSpace: preset.value })}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    data.maxSpace === preset.value
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                      : "bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06] pt-5 space-y-4">
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <ShieldAlert size={12} />
              安全参数
            </p>

            {/* Max Login Attempts */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                最大登录尝试次数
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={data.maxLoginAttempts}
                  onChange={(e) => onChange({ ...data, maxLoginAttempts: Math.max(1, Number(e.target.value)) })}
                  min={1}
                  max={20}
                  className="w-20 h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 text-center focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                <span className="text-xs text-slate-500">次（超过后锁定账号）</span>
              </div>
            </div>

            {/* Session Timeout */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Clock size={13} />
                会话超时时间
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={data.sessionTimeout}
                  onChange={(e) => onChange({ ...data, sessionTimeout: Math.max(1, Number(e.target.value)) })}
                  min={1}
                  className="w-20 h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 text-center focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                <span className="text-xs text-slate-500">小时</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
