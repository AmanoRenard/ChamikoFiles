"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Home, X, FolderOpen } from "lucide-react";

interface FolderItem {
  name: string;
  path: string;
  hasChildren?: boolean;
}

interface MoveDialogProps {
  open: boolean;
  itemName: string;
  currentPath: string;
  spaceType?: string;
  spaceId?: string;
  onMove: (targetPath: string) => void;
  onClose: () => void;
}

export function MoveDialog({ open, itemName, currentPath, spaceType, spaceId, onMove, onClose }: MoveDialogProps) {
  const [selectedPath, setSelectedPath] = useState("");
  const [currentBrowsePath, setCurrentBrowsePath] = useState("");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取文件夹列表
  const fetchFolders = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ path });
      if (spaceType) params.set("spaceType", spaceType);
      if (spaceId) params.set("spaceId", spaceId);
      const res = await fetch(`/api/files/folders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFolders(data.data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [spaceType, spaceId]);

  // 打开时重置并加载根目录
  useEffect(() => {
    if (open) {
      setSelectedPath("");
      setCurrentBrowsePath("");
      fetchFolders("");
    }
  }, [open, fetchFolders]);

  // 进入文件夹，清除之前的选中，以当前浏览目录作为目标
  const navigateInto = useCallback(async (folderPath: string) => {
    setSelectedPath("");
    setCurrentBrowsePath(folderPath);
    await fetchFolders(folderPath);
  }, [fetchFolders]);

  // 回到根目录
  const goHome = useCallback(async () => {
    setCurrentBrowsePath("");
    await fetchFolders("");
  }, [fetchFolders]);

  // 切换选中/取消选中
  const toggleSelect = (folderPath: string) => {
    setSelectedPath(prev => (prev === folderPath ? "" : folderPath));
  };

  // 实际移动目标：优先 selectedPath，空则用当前浏览目录
  const actualTarget = selectedPath || currentBrowsePath;

  // 面包屑路径段
  const breadcrumbSegments = useMemo(() => {
    if (!currentBrowsePath) return [];
    return currentBrowsePath.split("/").filter(Boolean);
  }, [currentBrowsePath]);

  const isAtRoot = currentBrowsePath === "";

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md mx-4 glass-card border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-semibold text-slate-200">移动到</h3>
              <p className="text-xs text-slate-500 mt-0.5">移动: {itemName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-all"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          {/* Breadcrumb + Navigation */}
          <div className="flex items-center gap-1 px-4 py-2.5 border-b border-white/[0.04] overflow-x-auto">
            {/* Home */}
            <button
              onClick={goHome}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:bg-white/[0.04] flex-shrink-0 ${
                isAtRoot ? "text-primary-light" : "text-slate-400 hover:text-slate-300"
              }`}
              title="根目录"
            >
              <Home size={13} />
            </button>

            {/* Breadcrumb segments */}
            {breadcrumbSegments.map((segment, idx) => {
              const segPath = breadcrumbSegments.slice(0, idx + 1).join("/");
              const isLast = idx === breadcrumbSegments.length - 1;
              return (
                <div key={segPath} className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-slate-600 text-xs">/</span>
                  {isLast ? (
                    <span className="px-1.5 py-0.5 rounded text-xs text-slate-300 font-medium">
                      {segment}
                    </span>
                  ) : (
                    <button
                      onClick={() => void navigateInto(segPath)}
                      className="px-1.5 py-0.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all"
                    >
                      {segment}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Folder list */}
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <FolderOpen size={28} className="mb-2 opacity-40" />
                <p className="text-xs">此目录下没有文件夹</p>
              </div>
            ) : (
              folders.map((folder) => {
                const isSelected = selectedPath === folder.path;
                return (
                  <div
                    key={folder.path}
                    className={`flex items-center gap-2 px-5 py-2.5 transition-all border-b border-white/[0.03] ${
                      isSelected ? "bg-primary/[0.08]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Radio circle — 点击选择/取消选择 */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(folder.path);
                      }}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Folder row — 点击进入文件夹 */}
                    <div
                      onClick={() => void navigateInto(folder.path)}
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    >
                      <Folder size={18} className="text-amber-400/80 flex-shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{folder.name}</span>

                      {folder.path === currentPath && (
                        <span className="text-[10px] text-slate-600 flex-shrink-0 ml-auto px-1.5 py-0.5 rounded bg-white/[0.03]">
                          当前
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.06]">
            <div className="flex-1 text-xs text-slate-500 truncate">
              {actualTarget ? (
                <span>
                  目标: <span className="text-slate-400">/{actualTarget}</span>
                </span>
              ) : (
                <span className="text-slate-600">根目录</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (actualTarget === currentPath) return;
                onMove(actualTarget);
              }}
              disabled={actualTarget === currentPath}
              className="px-4 py-2 rounded-xl bg-primary/20 text-primary-light text-xs font-medium hover:bg-primary/30 border border-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              移动到此
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
