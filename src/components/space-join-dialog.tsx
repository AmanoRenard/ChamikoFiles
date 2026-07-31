"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, Loader2 } from "lucide-react";
import { useToast } from "./toast-provider";

interface Props {
  open: boolean;
  onClose: () => void;
  onJoined: (spaceId: string) => void;
}

export function SpaceJoinDialog({ open, onClose, onJoined }: Props) {
  const { addToast } = useToast();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      addToast("请输入邀请码", "error");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch("/api/spaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("已加入空间", "success");
        onJoined(data.data.id);
        onClose();
        setCode("");
      } else {
        addToast(data.error || "加入失败", "error");
      }
    } catch {
      addToast("网络错误", "error");
    }
    setJoining(false);
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
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <LogIn size={16} className="text-emerald-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">
                  加入空间
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
                <label className="text-xs text-slate-400 mb-1.5 block">
                  输入邀请码
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoin();
                  }}
                  placeholder="例如：A1B2-C3D4"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 transition-all tracking-widest text-center"
                  autoFocus
                  maxLength={20}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={!code.trim() || joining}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
              >
                {joining ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                加入空间
              </button>

              <p className="text-xs text-slate-600 text-center">
                向空间所有者获取邀请码
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
