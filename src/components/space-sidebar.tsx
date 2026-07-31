"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Users,
  Plus,
  MoreHorizontal,
  Loader2,
  LogIn,
} from "lucide-react";
import { SpaceSummary } from "@/types";
import { SpaceCreatorDialog } from "./space-creator-dialog";
import { SpaceSettingsMenu } from "./space-settings-menu";
import { SpaceInviteDialog } from "./space-invite-dialog";
import { SpaceMembersDialog } from "./space-members-dialog";
import { SpaceJoinDialog } from "./space-join-dialog";

interface Props {
  spaces: SpaceSummary[];
  currentSpaceId: string;
  currentSpaceType: string;
  canCreateMore: boolean;
  maxSharedSpaces: number;
  loading: boolean;
  onSwitchSpace: (spaceId: string, spaceType: "personal" | "shared") => void;
  onSpaceUpdated: () => void;
}

export function SpaceSidebar({
  spaces,
  currentSpaceId,
  currentSpaceType,
  canCreateMore,
  maxSharedSpaces,
  loading,
  onSwitchSpace,
  onSpaceUpdated,
}: Props) {
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<SpaceSummary | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  // Dialog states lifted here so they survive menu close
  const [inviteSpaceId, setInviteSpaceId] = useState<string | null>(null);
  const [membersSpaceId, setMembersSpaceId] = useState<string | null>(null);
  const [membersIsOwner, setMembersIsOwner] = useState(true);

  const ownedSharedCount = spaces.filter(
    (s) => s.type === "shared" && s.role === "owner"
  ).length;

  if (loading) {
    return (
      <div className="w-[220px] flex-shrink-0 hidden lg:flex items-center justify-center border-r border-white/[0.04] bg-surface-dark/30">
        <Loader2 size={18} className="animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 border-r border-white/[0.04] bg-surface-dark/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.04]">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            空间
          </span>
        </div>

        {/* Space list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {spaces.map((space) => {
            const isActive =
              space.id === currentSpaceId && space.type === currentSpaceType;
            const isPersonal = space.type === "personal";
            const Icon = isPersonal ? User : Users;

            return (
              <motion.button
                key={`${space.type}:${space.id}`}
                onClick={() => onSwitchSpace(space.id, space.type)}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group relative ${
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-primary-cyan/10 border-l-[3px] border-primary shadow-sm"
                    : "hover:bg-white/[0.04] border-l-[3px] border-transparent"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive
                      ? "bg-primary/20 text-primary-light"
                      : "bg-white/[0.04] text-slate-400 group-hover:text-slate-300"
                  }`}
                >
                  <Icon size={15} />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isActive ? "text-slate-100" : "text-slate-400"
                    }`}
                  >
                    {isPersonal ? "个人空间" : space.name}
                  </p>
                  {!isPersonal && (
                    <p className="text-[10px] text-slate-600 truncate">
                      {space.memberCount} 位成员
                    </p>
                  )}
                </div>

                {/* Settings menu button (only for owner of shared spaces) */}
                {!isPersonal && space.role === "owner" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuAnchor({ x: rect.right, y: rect.top });
                      setMenuTarget(space);
                    }}
                    className="w-6 h-6 rounded-md hover:bg-white/[0.08] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreHorizontal size={12} className="text-slate-500" />
                  </button>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Create / Join button */}
        <div className="p-2 border-t border-white/[0.04] space-y-1">
          <button
            onClick={() => setCreatorOpen(true)}
            disabled={!canCreateMore}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
              canCreateMore
                ? "hover:bg-primary/10 text-slate-400 hover:text-primary-light"
                : "opacity-40 cursor-not-allowed text-slate-600"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <Plus size={15} className={canCreateMore ? "" : "text-slate-600"} />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium">创建共享空间</p>
              {canCreateMore && (
                <p className="text-[10px] text-slate-600">
                  剩余 {maxSharedSpaces - ownedSharedCount} 个
                </p>
              )}
            </div>
          </button>

          <button
            onClick={() => setJoinOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <LogIn size={15} />
            </div>
            <p className="text-xs font-medium">加入空间</p>
          </button>
        </div>
      </aside>

      {/* ===== Dialogs (rendered at sidebar level so they survive menu close) ===== */}

      <SpaceCreatorDialog
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreated={() => {
          setCreatorOpen(false);
          onSpaceUpdated();
        }}
      />

      {menuTarget && menuAnchor && (
        <SpaceSettingsMenu
          space={menuTarget}
          anchorRect={menuAnchor}
          onClose={() => {
            setMenuTarget(null);
            setMenuAnchor(null);
          }}
          onUpdate={onSpaceUpdated}
          onInvite={() => {
            setInviteSpaceId(menuTarget.id);
            setMenuTarget(null);
            setMenuAnchor(null);
          }}
          onMembers={() => {
            setMembersSpaceId(menuTarget.id);
            setMembersIsOwner(true);
            setMenuTarget(null);
            setMenuAnchor(null);
          }}
        />
      )}

      {inviteSpaceId && (
        <SpaceInviteDialog
          spaceId={inviteSpaceId}
          open={true}
          onClose={() => setInviteSpaceId(null)}
        />
      )}

      {membersSpaceId && (
        <SpaceMembersDialog
          spaceId={membersSpaceId}
          open={true}
          onClose={() => setMembersSpaceId(null)}
          isOwner={membersIsOwner}
        />
      )}

      <SpaceJoinDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoined={(spaceId) => {
          onSpaceUpdated();
          onSwitchSpace(spaceId, "shared");
        }}
      />
    </>
  );
}
