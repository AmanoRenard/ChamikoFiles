"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User, Users, Plus, Settings, Loader2 } from "lucide-react";
import { SpaceSummary } from "@/types";
import { SpaceCreatorDialog } from "./space-creator-dialog";

interface Props {
  spaces: SpaceSummary[];
  currentSpace: SpaceSummary | undefined;
  currentSpaceId: string;
  currentSpaceType: string;
  onSwitchSpace: (spaceId: string, spaceType: "personal" | "shared") => void;
  onSpaceUpdated: () => void;
}

export function SpaceSelector({
  spaces,
  currentSpace,
  currentSpaceId,
  currentSpaceType,
  onSwitchSpace,
  onSpaceUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const Icon = currentSpaceType === "personal" ? User : Users;
  const ownedCount = spaces.filter(
    (s) => s.type === "shared" && s.role === "owner"
  ).length;
  const maxShared = ownedCount < 3; // Will be dynamic via prop if needed

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all"
        >
          <Icon size={13} className="text-slate-400" />
          <span className="text-xs text-slate-300 max-w-[100px] truncate">
            {currentSpace?.name || "选择空间"}
          </span>
          <ChevronDown
            size={12}
            className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1.5 w-64 bg-[#1A1530] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-xl z-50 overflow-hidden"
            >
              <div className="py-1.5 px-1.5">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  切换空间
                </p>
                {spaces.map((space) => {
                  const isActive =
                    space.id === currentSpaceId &&
                    space.type === currentSpaceType;
                  const isPersonal = space.type === "personal";
                  const SpaceIcon = isPersonal ? User : Users;

                  return (
                    <button
                      key={`${space.type}:${space.id}`}
                      onClick={() => {
                        onSwitchSpace(space.id, space.type);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-primary/10"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive
                            ? "bg-primary/20 text-primary-light"
                            : "bg-white/[0.04] text-slate-400"
                        }`}
                      >
                        <SpaceIcon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {isPersonal ? "个人空间" : space.name}
                        </p>
                        {!isPersonal && (
                          <p className="text-[10px] text-slate-500">
                            {space.memberCount} 位成员
                          </p>
                        )}
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}

                <div className="border-t border-white/[0.04] mt-1.5 pt-1.5">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setCreatorOpen(true);
                    }}
                    disabled={!maxShared}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                      maxShared
                        ? "hover:bg-primary/10 text-slate-400 hover:text-primary-light"
                        : "opacity-40 cursor-not-allowed text-slate-600"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                      <Plus size={14} />
                    </div>
                    <span className="text-xs">
                      {maxShared ? "创建共享空间" : "已达创建上限"}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SpaceCreatorDialog
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreated={() => {
          setCreatorOpen(false);
          onSpaceUpdated();
        }}
      />
    </>
  );
}
