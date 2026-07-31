"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Crown, XCircle, Loader2 } from "lucide-react";
import { useToast } from "./toast-provider";
import { SpaceMember } from "@/types";
import { formatDate } from "@/lib/file-utils";

interface Props {
  spaceId: string;
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
}

export function SpaceMembersDialog({ spaceId, open, onClose, isOwner }: Props) {
  const { addToast } = useToast();
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [spaceId]);

  useEffect(() => {
    if (open) fetchMembers();
  }, [open, fetchMembers]);

  const handleRemove = async (userId: number, username: string) => {
    try {
      const res = await fetch(
        `/api/spaces/${spaceId}/members?userId=${userId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        addToast(`已移除「${username}」`, "success");
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      } else {
        addToast(data.error || "移除失败", "error");
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
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <User size={16} className="text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-200">
                  成员管理 ({members.length}人)
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center"
              >
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-slate-500" />
                </div>
              ) : (
                <div className="py-2">
                  {members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          member.role === "owner"
                            ? "bg-primary/20"
                            : "bg-white/[0.04]"
                        }`}
                      >
                        {member.role === "owner" ? (
                          <Crown size={14} className="text-primary-light" />
                        ) : (
                          <User size={14} className="text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate">
                          {member.username}
                          {member.role === "owner" && (
                            <span className="ml-1.5 text-[10px] text-primary-light bg-primary/10 px-1.5 py-0.5 rounded">
                              创建者
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          加入于 {formatDate(member.joinedAt)}
                        </p>
                      </div>
                      {isOwner && member.role !== "owner" && (
                        <button
                          onClick={() =>
                            handleRemove(member.userId, member.username)
                          }
                          className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-all group"
                          title="移除成员"
                        >
                          <XCircle
                            size={14}
                            className="text-slate-600 group-hover:text-red-400 transition-colors"
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
