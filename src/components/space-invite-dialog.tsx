"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, RefreshCw, Clock, Check, Trash2, Loader2 } from "lucide-react";
import { useToast } from "./toast-provider";
import { SpaceInviteInfo } from "@/types";

interface Props {
  spaceId: string;
  open: boolean;
  onClose: () => void;
}

export function SpaceInviteDialog({ spaceId, open, onClose }: Props) {
  const { addToast } = useToast();
  const [invite, setInvite] = useState<SpaceInviteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState("");

  const fetchInvite = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/invite`);
      const data = await res.json();
      if (data.success && data.data) {
        setInvite(data.data);
      }
    } catch {
      // no active invite
    }
    setLoading(false);
  }, [spaceId]);

  useEffect(() => {
    if (open) fetchInvite();
  }, [open, fetchInvite]);

  useEffect(() => {
    if (!invite) return;
    const update = () => {
      const remaining = Math.max(0, invite.remainingSeconds - 1);
      invite.remainingSeconds = remaining;
      if (remaining <= 0) {
        setCountdown("已过期");
        return;
      }
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      setCountdown(`${h}时${m}分${s}秒`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [invite]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setInvite(data.data);
        addToast("邀请链接已生成", "success");
      } else {
        addToast(data.error || "生成失败", "error");
      }
    } catch {
      addToast("网络错误", "error");
    }
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast("已复制邀请码", "info");
  };

  const handleRevoke = async () => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/invite`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setInvite(null);
        addToast("邀请链接已撤销", "success");
      }
    } catch {
      addToast("网络错误", "error");
    }
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
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <RefreshCw size={16} className="text-cyan-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">
                  邀请成员
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-slate-500" />
                </div>
              ) : invite ? (
                <>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-2">邀请码</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-2xl font-bold text-primary-light tracking-[0.3em] select-all">
                        {invite.code}
                      </code>
                      <button
                        onClick={handleCopy}
                        className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-all flex-shrink-0"
                      >
                        {copied ? (
                          <Check size={14} className="text-green-400" />
                        ) : (
                          <Copy size={14} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Clock size={14} className="text-amber-400" />
                    <span className="text-xs text-amber-300">
                      {countdown ? `剩余 ${countdown}` : "计算中..."}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>有效期 24 小时，生成新码后旧码自动失效</p>
                    <p>已有 {invite.usedCount} 人通过该邀请加入</p>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="flex-1 h-10 rounded-xl bg-gradient-to-r from-primary to-primary-cyan text-white text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                    >
                      {generating ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      重新生成
                    </button>
                    <button
                      onClick={handleRevoke}
                      className="h-10 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="text-slate-500">
                    <RefreshCw
                      size={32}
                      className="mx-auto mb-2 text-slate-600"
                    />
                    <p className="text-sm">暂无有效邀请链接</p>
                    <p className="text-xs mt-1">
                      生成邀请码后可分享给其他人加入
                    </p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-primary to-primary-cyan text-white text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                  >
                    {generating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    生成邀请码
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
