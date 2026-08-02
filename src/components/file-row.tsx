"use client";

import { memo, useRef } from "react";
import { FileInfo } from "@/types";
import { formatFileSize, formatDate, getFileTypeIcon } from "@/lib/file-utils";
import { File, Folder, Check, Music, Video, FileText, Archive } from "lucide-react";
import { motion } from "framer-motion";

interface FileRowProps {
  file: FileInfo;
  subpath: string;
  isSelectMode: boolean;
  selected: boolean;
  onToggleSelect: (name: string) => void;
  onDelete: (name: string) => void;
  onPreview: (file: FileInfo) => void;
  onOpenFolder: (folderName: string) => void;
  onContextMenu: (e: React.MouseEvent, file: FileInfo) => void;
}

function FileRowRaw({
  file,
  subpath,
  isSelectMode,
  selected,
  onToggleSelect,
  onDelete,
  onPreview,
  onOpenFolder,
  onContextMenu,
}: FileRowProps) {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const wasDrag = (e: React.MouseEvent): boolean => {
    if (!mouseDownPos.current) return false;
    const dx = e.clientX - mouseDownPos.current.x;
    const dy = e.clientY - mouseDownPos.current.y;
    return Math.abs(dx) > 5 || Math.abs(dy) > 5;
  };

  // Mobile: long press to toggle select
  const handleTouchStart = (e: React.TouchEvent) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      // 阻止浏览器默认长按菜单（夸克等国产浏览器兼容）
      e.preventDefault();
      onToggleSelect(file.name);
      // Vibrate feedback
      if (navigator.vibrate) navigator.vibrate(10);
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // If long press was triggered, prevent default behavior and context menu
    if (longPressTriggered.current) {
      e.preventDefault();
      longPressTriggered.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // 如果长按已触发，阻止后续默认行为（防止拖动后弹菜单）
    if (longPressTriggered.current) {
      e.preventDefault();
    }
  };

  const iconType = getFileTypeIcon(file.ext.toLowerCase());

  const iconColors: Record<string, string> = {
    "file-text": "text-blue-400 bg-blue-500/10",
    "file-spreadsheet": "text-emerald-400 bg-emerald-500/10",
    presentation: "text-orange-400 bg-orange-500/10",
    "file-archive": "text-rose-400 bg-rose-500/10",
    music: "text-primary bg-primary/10",
    video: "text-purple-400 bg-purple-500/10",
    "file-code": "text-cyan-400 bg-cyan-500/10",
    file: "text-slate-400 bg-slate-500/10",
  };

  const downloadUrl = `/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}`;
  const thumbnailUrl = `/api/files/thumbnail?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}&size=row`;

  const handleIconClick = (e: React.MouseEvent) => {
    if (wasDrag(e)) return;
    e.stopPropagation();
    // 多选模式或按住 Ctrl/Meta 时，也走选中逻辑
    if (isSelectMode || e.ctrlKey || e.metaKey) {
      onToggleSelect(file.name);
      return;
    }
    if (file.isFolder) {
      onOpenFolder(file.name);
    } else {
      onPreview(file);
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (wasDrag(e)) return;
    // 多选模式或按住 Ctrl/Meta 时，点击切换选中
    if (isSelectMode || e.ctrlKey || e.metaKey) {
      onToggleSelect(file.name);
      return;
    }
    if (file.isFolder) {
      onOpenFolder(file.name);
    } else {
      onPreview(file);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(file.name);
  };

  const showCheckbox = isSelectMode || selected;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2 }}
      className={`glass-card flex items-center gap-4 px-5 py-3 cursor-pointer transition-all duration-200 hover:bg-white/[0.06] hover:shadow-md hover:shadow-primary/5 hover:scale-[1.005] group select-none ${
        selected ? "ring-2 ring-primary/60" : ""
      }`}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, file);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={handleRowClick}
    >
      {/* Select checkbox — always rendered, visibility controlled by CSS */}
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer ${
          showCheckbox
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        } ${
          selected
            ? "bg-primary border-primary"
            : "border-white/30 bg-black/40 hover:border-white/50"
        }`}
        onClick={handleCheckboxClick}
      >
        {selected && <Check size={12} className="text-white" />}
      </div>

      {/* Icon — click to open/preview */}
      <div onClick={handleIconClick}>
        {file.isFolder ? (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
            <Folder size={20} className="text-amber-400" />
          </div>
        ) : file.isImage ? (
          <div className="relative w-10 h-10 flex-shrink-0">
            <img
              src={thumbnailUrl}
              alt={file.name}
              className="w-10 h-10 rounded-xl object-cover transition-transform duration-300 hover:scale-110"
              draggable={false}
              style={{ WebkitTouchCallout: "none", pointerEvents: "none" }}
            />
            {/* 透明覆盖层，拦截图片上的长按事件，防止浏览器弹出图片菜单 */}
            <div
              className="absolute inset-0"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        ) : file.isAudio ? (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Music size={20} className="text-primary" />
          </div>
        ) : file.isVideo ? (
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <Video size={20} className="text-purple-400" />
          </div>
        ) : file.isText ? (
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-cyan-400" />
          </div>
        ) : iconType === "file-archive" ? (
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
            <Archive size={20} className="text-rose-400" />
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColors[iconType] || iconColors.file}`}
          >
            <File size={20} />
          </div>
        )}
      </div>

      {/* Name — text selectable, does NOT trigger preview */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-slate-200 truncate select-none"
        >
          <span
            className="select-text cursor-text"
            onClick={(e) => e.stopPropagation()}
          >
            {file.name}
          </span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5 select-none">
          {file.isFolder
            ? `${file.folderItemCount ?? 0} 项`
            : `${file.ext.toUpperCase().replace(".", "")} 文件`}
        </p>
      </div>

      {/* Size */}
      <div className="hidden sm:block w-24 text-right select-none" style={{ WebkitTouchCallout: "none" }}>
        <span className="text-sm text-slate-400">
          {file.isFolder ? "" : formatFileSize(file.size)}
        </span>
      </div>

      {/* Date */}
      <div className="hidden md:block w-36 text-right select-none" style={{ WebkitTouchCallout: "none" }}>
        <span className="text-sm text-slate-500">{formatDate(file.lastModified)}</span>
      </div>
    </motion.div>
  );
}

export const FileRow = memo(FileRowRaw);
