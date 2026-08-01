"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Camera,
  Pencil,
  Check,
  X,
  LogOut,
  Shield,
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";

interface UserProfilePopupProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function UserProfilePopup({
  open,
  onClose,
  anchorRef,
}: UserProfilePopupProps) {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const popupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleStartEditNickname = useCallback(() => {
    if (!user) return;
    setNicknameValue(user.nickname || user.username);
    setEditingNickname(true);
  }, [user]);

  const handleSaveNickname = useCallback(async () => {
    if (!user || savingNickname) return;
    const trimmed = nicknameValue.trim();
    if (!trimmed || trimmed === (user.nickname || user.username)) {
      setEditingNickname(false);
      return;
    }
    setSavingNickname(true);
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: trimmed }),
    });
    const data = await res.json();
    if (data.success) {
      await refreshUser();
    } else {
      addToast(data.error || "修改失败", "error");
    }
    setSavingNickname(false);
    setEditingNickname(false);
  }, [user, nicknameValue, savingNickname, refreshUser, addToast]);

  const handleNicknameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSaveNickname();
      if (e.key === "Escape") setEditingNickname(false);
    },
    [handleSaveNickname]
  );

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be selected again
      e.target.value = "";

      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser();
        addToast("头像更新成功", "success");
      } else {
        addToast(data.error || "上传失败", "error");
      }
      setUploadingAvatar(false);
    },
    [refreshUser, addToast]
  );

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push("/login");
  };

  if (!user) return null;

  const displayName = user.nickname || user.username;
  const avatarSrc = user.avatar || null;
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="absolute right-0 top-full mt-2 w-[280px] z-[200]"
        >
          <div className="rounded-2xl bg-[#141024]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header gradient bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-primary-cyan to-primary" />

            {/* Avatar & basic info */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start gap-4">
                {/* Avatar area */}
                <div className="relative group flex-shrink-0">
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                    className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/[0.08] 
                               bg-white/[0.04] flex items-center justify-center
                               group-hover:border-primary/50 transition-all duration-300
                               focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={28} className="text-slate-500" />
                    )}

                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      {uploadingAvatar ? (
                        <div className="w-5 h-5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={18} className="text-white/80" />
                      )}
                    </div>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* Name & role */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-100 truncate">
                      {user.username}
                    </h3>
                    {user.isAdmin && (
                      <span
                        className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md 
                                      bg-primary/10 border border-primary/20 text-[10px] text-primary-light"
                      >
                        <Shield size={10} />
                        管理员
                      </span>
                    )}
                  </div>

                  {/* Nickname */}
                  {editingNickname ? (
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={nicknameValue}
                        onChange={(e) => setNicknameValue(e.target.value)}
                        onKeyDown={handleNicknameKeyDown}
                        onBlur={handleSaveNickname}
                        maxLength={32}
                        autoFocus
                        className="flex-1 bg-white/[0.06] border border-primary/40 rounded-lg px-2.5 py-1 
                                   text-xs text-slate-200 placeholder-slate-500 outline-none
                                   focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                        placeholder="输入昵称..."
                      />
                      <button
                        onClick={handleSaveNickname}
                        disabled={savingNickname}
                        className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 
                                   flex items-center justify-center hover:bg-primary/30 transition-all
                                   text-primary-light"
                      >
                        {savingNickname ? (
                          <div className="w-3 h-3 border border-primary-light border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingNickname(false)}
                        className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] 
                                   flex items-center justify-center hover:bg-white/[0.08] transition-all
                                   text-slate-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-1.5 group/nickname">
                      <span className="text-xs text-slate-400">
                        {displayName}
                      </span>
                      <button
                        onClick={handleStartEditNickname}
                        className="w-5 h-5 rounded flex items-center justify-center 
                                   opacity-0 group-hover/nickname:opacity-100
                                   hover:bg-white/[0.08] transition-all text-slate-500 hover:text-slate-300"
                        title="修改昵称"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-white/[0.06]" />

            {/* Info section */}
            <div className="px-5 py-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Clock size={11} className="flex-shrink-0" />
                <span>注册于 {joinedDate}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-white/[0.06]" />

            {/* Actions */}
            <div className="px-5 py-3">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl
                           bg-red-500/[0.06] border border-red-500/[0.12] 
                           hover:bg-red-500/[0.12] hover:border-red-500/[0.2] 
                           transition-all group"
              >
                <LogOut
                  size={14}
                  className="text-red-400 group-hover:text-red-300 transition-colors"
                />
                <span className="text-xs text-red-400 group-hover:text-red-300 transition-colors">
                  退出登录
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
