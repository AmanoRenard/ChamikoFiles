"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderSync, SkipForward, MoveRight, Copy, X, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";

export type MigrateMode = "move" | "copy" | "skip";

interface StorageMigrateDialogProps {
  open: boolean;
  oldPath: string;
  newPath: string;
  onMigrate: (mode: MigrateMode) => Promise<void>;
  onClose: () => void;
}

export function StorageMigrateDialog({
  open,
  oldPath,
  newPath,
  onMigrate,
  onClose,
}: StorageMigrateDialogProps) {
  const [selectedMode, setSelectedMode] = useState<MigrateMode>("move");
  const [migrating, setMigrating] = useState(false);

  const handleConfirm = async () => {
    setMigrating(true);
    try {
      await onMigrate(selectedMode);
    } finally {
      setMigrating(false);
    }
  };

  if (!open) return null;

  const options: {
    mode: MigrateMode;
    icon: typeof FolderSync;
    title: string;
    desc: string;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      mode: "skip",
      icon: SkipForward,
      title: "跳过迁移",
      desc: "仅切换存储路径，已有文件保留在原位不动，之后上传的新文件将保存到新路径",
    },
    {
      mode: "move",
      icon: MoveRight,
      title: "移动文件",
      desc: "直接移动文件到新路径，速度快，不占额外磁盘空间。同一磁盘分区内几乎是瞬间完成",
      badge: "推荐",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    },
    {
      mode: "copy",
      icon: Copy,
      title: "仅复制文件",
      desc: "复制文件到新路径，原文件保留不删。更安全但会占用双倍空间，适合想保留备份的场景",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={migrating ? undefined : onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg mx-4 glass-card border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderSync size={18} className="text-primary-light" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">更改存储路径</h3>
                <p className="text-xs text-slate-500 mt-0.5">检测到存储路径变更，已有文件需要处理</p>
              </div>
            </div>
            {!migrating && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-all"
              >
                <X size={16} className="text-slate-500" />
              </button>
            )}
          </div>

          {/* Path comparison */}
          <div className="px-5 py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex-1 min-w-0">
                <div className="text-slate-500 mb-1">当前路径</div>
                <div className="text-slate-400 truncate font-mono bg-white/[0.02] rounded-lg px-2.5 py-1.5">
                  {oldPath.replace(/\\/g, "/")}
                </div>
              </div>
              <div className="text-slate-600 mt-4 flex-shrink-0">
                <MoveRight size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-500 mb-1">新路径</div>
                <div className="text-primary-light truncate font-mono bg-primary/[0.06] rounded-lg px-2.5 py-1.5">
                  {newPath.replace(/\\/g, "/")}
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="px-5 py-3 space-y-2">
            {options.map((opt) => {
              const isSelected = selectedMode === opt.mode;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.mode}
                  onClick={() => !migrating && setSelectedMode(opt.mode)}
                  disabled={migrating}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all border ${
                    isSelected
                      ? "border-primary/30 bg-primary/[0.06]"
                      : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {/* Radio */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-white/20 group-hover:border-white/40"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={isSelected ? "text-primary-light" : "text-slate-500"} />
                      <span className={`text-sm font-medium ${isSelected ? "text-slate-200" : "text-slate-400"}`}>
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06]">
            {migrating ? (
              <div className="flex items-center gap-2 text-sm text-primary-light">
                <Loader2 size={16} className="animate-spin" />
                正在迁移文件...
              </div>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                >
                  {selectedMode === "skip"
                    ? "跳过并保存"
                    : selectedMode === "move"
                      ? "移动并保存"
                      : "复制并保存"}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
