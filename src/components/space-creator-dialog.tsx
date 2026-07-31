"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderPlus, Loader2 } from "lucide-react";
import { useToast } from "./toast-provider";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function SpaceCreatorDialog({ open, onClose, onCreated }: Props) {
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) return;

    setCreating(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`已创建共享空间「${trimmed}」`, "success");
        onCreated();
      } else {
        addToast(data.error || "创建失败", "error");
      }
    } catch {
      addToast("网络错误", "error");
    }
    setCreating(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#1A1530] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FolderPlus size={16} className="text-primary-light" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">
                  创建共享空间
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center"
              >
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  空间名称
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") onClose();
                  }}
                  placeholder="例如：项目协作、设计素材"
                  maxLength={50}
                  className="w-full h-10 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all"
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  1-50 个字符，创建后可邀请其他人加入
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:bg-white/[0.08] transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-primary to-primary-cyan text-white text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "创建空间"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
