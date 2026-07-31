"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  Share2,
  Users,
  Trash2,
  X,
} from "lucide-react";
import { SpaceSummary } from "@/types";
import { useToast } from "./toast-provider";

interface Props {
  space: SpaceSummary;
  anchorRect?: { x: number; y: number };
  onClose: () => void;
  onUpdate: () => void;
  onInvite: () => void;
  onMembers: () => void;
}

export function SpaceSettingsMenu({
  space,
  anchorRect,
  onClose,
  onUpdate,
  onInvite,
  onMembers,
}: Props) {
  const { addToast } = useToast();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(space.name);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === space.name) {
      setRenaming(false);
      return;
    }
    try {
      const res = await fetch(`/api/spaces/${space.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("已重命名", "success");
        onUpdate();
      } else {
        addToast(data.error || "重命名失败", "error");
      }
    } catch {
      addToast("网络错误", "error");
    }
    setRenaming(false);
  };

  const handleDelete = async () => {
    if (deleteInput !== space.name) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/spaces/${space.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addToast("空间已删除", "success");
        onClose();
        onUpdate();
      } else {
        addToast(data.error || "删除失败", "error");
      }
    } catch {
      addToast("网络错误", "error");
    }
    setDeleting(false);
    setDeleteConfirm(false);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90]"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed z-[100] bg-[#1A1530] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden min-w-[200px]"
          style={{
            left: anchorRect ? `${Math.min(anchorRect.x, window.innerWidth - 220)}px` : "0px",
            top: anchorRect ? `${Math.min(anchorRect.y, window.innerHeight - 300)}px` : "0px",
          }}
        >
          {renaming ? (
            <div className="p-3 space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="w-full h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 focus:outline-none focus:border-primary/40"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRenaming(false)}
                  className="flex-1 h-8 rounded-lg bg-white/[0.04] text-xs text-slate-400 hover:bg-white/[0.08] transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleRename}
                  className="flex-1 h-8 rounded-lg bg-primary/20 text-xs text-primary-light hover:bg-primary/30 transition-all"
                >
                  确认
                </button>
              </div>
            </div>
          ) : (
            <div className="py-1.5">
              <button
                onClick={() => setRenaming(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-all"
              >
                <Pencil size={14} className="text-slate-500" />
                重命名
              </button>
              <button
                onClick={() => {
                  onInvite();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-all"
              >
                <Share2 size={14} className="text-slate-500" />
                邀请成员
              </button>
              <button
                onClick={() => {
                  onMembers();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-all"
              >
                <Users size={14} className="text-slate-500" />
                成员管理
              </button>
              <div className="border-t border-white/[0.04] my-1" />
              <button
                onClick={() => {
                  setDeleteConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} />
                删除空间
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(false)}
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
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Trash2 size={16} className="text-red-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    删除空间
                  </h2>
                </div>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center"
                >
                  <X size={14} className="text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="text-sm text-slate-400 space-y-2">
                  <p>
                    确定要删除「<span className="text-slate-200">{space.name}</span>」吗？
                  </p>
                  <p className="text-red-400 text-xs">
                    所有文件、成员关系和邀请链接将被永久删除！
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1.5">
                    请输入空间名称确认：
                  </p>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={space.name}
                    className="w-full h-10 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 transition-all"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteInput !== space.name || deleting}
                    className="flex-1 h-10 rounded-xl bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-500/30 transition-all"
                  >
                    {deleting ? "删除中..." : "确认删除"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
