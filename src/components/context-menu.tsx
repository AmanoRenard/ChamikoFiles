"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { Eye, Download, Pencil, Trash2, FolderOpen, Copy, MoveHorizontal } from "lucide-react";

interface ContextMenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
  header?: boolean; // 标题项，不可点击
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 40 - 20);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[9998] min-w-[180px] py-1.5 rounded-xl bg-[#0f0f23]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl"
        style={{ left: adjustedX, top: adjustedY }}
      >
        {items.map((item, idx) => (
          <div key={idx}>
            {item.divider && (
              <div className="my-1 border-t border-white/[0.06]" />
            )}
            {item.header ? (
              <div className="flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-slate-500 cursor-default">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm transition-all ${
                  item.danger
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export function getFileContextMenuItems(
  file: { name: string; isFolder: boolean; isImage: boolean; isVideo?: boolean; isAudio?: boolean; isText?: boolean },
  callbacks: {
    onOpen: () => void;
    onPreview: () => void;
    onDownload: () => void;
    onCopyLink: () => void;
    onRename: () => void;
    onMove: () => void;
    onDelete: () => void;
  }
): ContextMenuItem[] {
  if (file.isFolder) {
    return [
      {
        icon: <FolderOpen size={15} />,
        label: "打开",
        onClick: callbacks.onOpen,
      },
      {
        icon: <MoveHorizontal size={15} />,
        label: "移动",
        onClick: callbacks.onMove,
      },
      {
        icon: <Pencil size={15} />,
        label: "重命名",
        onClick: callbacks.onRename,
      },
      {
        icon: <Trash2 size={15} />,
        label: "删除",
        onClick: callbacks.onDelete,
        danger: true,
      },
    ];
  }

  const items: ContextMenuItem[] = [];

  if (file.isImage || file.isVideo || file.isAudio || file.isText) {
    items.push({
      icon: <Eye size={15} />,
      label: "预览",
      onClick: callbacks.onPreview,
    });
  }

  items.push({
    icon: <Download size={15} />,
    label: "下载",
    onClick: callbacks.onDownload,
  });

  items.push({
    icon: <Copy size={15} />,
    label: "复制链接",
    onClick: callbacks.onCopyLink,
  });

  items.push({
    icon: <MoveHorizontal size={15} />,
    label: "移动",
    onClick: callbacks.onMove,
  });

  items.push({
    icon: <Pencil size={15} />,
    label: "重命名",
    onClick: callbacks.onRename,
  });

  items.push({
    icon: <Trash2 size={15} />,
    label: "删除",
    onClick: callbacks.onDelete,
    danger: true,
  });

  return items;
}

// 批量操作右键菜单（≥2 个文件选中时）
export function getBatchContextMenuItems(callbacks: {
  onBatchDownload: () => void;
  onBatchMove: () => void;
  onBatchRename: () => void;
  onBatchDelete: () => void;
}): ContextMenuItem[] {
  return [
    {
      icon: null,
      label: "批量操作",
      onClick: () => {},
      header: true,
    },
    {
      icon: <Download size={15} />,
      label: "下载",
      onClick: callbacks.onBatchDownload,
    },
    {
      icon: <MoveHorizontal size={15} />,
      label: "移动",
      onClick: callbacks.onBatchMove,
    },
    {
      icon: <Pencil size={15} />,
      label: "重命名",
      onClick: callbacks.onBatchRename,
    },
    {
      icon: <Trash2 size={15} />,
      label: "删除",
      onClick: callbacks.onBatchDelete,
      danger: true,
    },
  ];
}

// 检查是否为标题项（不可点击）
export function isBatchHeaderItem(label: string): boolean {
  return label === "批量操作";
}
