"use client";

import { memo, useRef } from "react";
import { FileInfo } from "@/types";
import { formatFileSize, formatDate, getFileTypeIcon } from "@/lib/file-utils";
import { File, Folder, Check, Music, Video, FileText, Archive } from "lucide-react";
import { motion } from "framer-motion";

interface FileCardProps {
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

function FileCardRaw({
  file,
  subpath,
  isSelectMode,
  selected,
  onToggleSelect,
  onDelete,
  onPreview,
  onOpenFolder,
  onContextMenu,
}: FileCardProps) {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const wasDrag = (e: React.MouseEvent): boolean => {
    if (!mouseDownPos.current) return false;
    const dx = e.clientX - mouseDownPos.current.x;
    const dy = e.clientY - mouseDownPos.current.y;
    return Math.abs(dx) > 5 || Math.abs(dy) > 5;
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
  const thumbnailUrl = `/api/files/thumbnail?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}&size=card`;

  const handleClick = (e: React.MouseEvent) => {
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

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(file.name);
  };

  const showCheckbox = isSelectMode || selected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`glass-card overflow-hidden cursor-pointer relative group hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${
        selected ? "ring-2 ring-primary/60" : ""
      }`}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, file);
      }}
      onClick={handleClick}
    >
      {/* Select checkbox — always rendered, visibility controlled by CSS */}
      <div
        className={`absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 cursor-pointer ${
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

      {/* Preview area — click to open/preview */}
      <div
        className="relative aspect-square bg-white/[0.02] flex items-center justify-center overflow-hidden"
        onClick={handleIconClick}
      >
        {file.isFolder ? (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Folder size={24} className="sm:size-[32px] text-amber-400" />
          </div>
        ) : file.isImage ? (
          <img
            src={thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            draggable={false}
          />
        ) : file.isAudio ? (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Music size={24} className="sm:size-[32px] text-primary" />
          </div>
        ) : file.isVideo ? (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Video size={24} className="sm:size-[32px] text-purple-400" />
          </div>
        ) : file.isText ? (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-cyan-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <FileText size={24} className="sm:size-[32px] text-cyan-400" />
          </div>
        ) : iconType === "file-archive" ? (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-rose-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Archive size={24} className="sm:size-[32px] text-rose-400" />
          </div>
        ) : (
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${iconColors[iconType] || iconColors.file}`}
          >
            <File size={24} className="sm:size-[32px]" />
          </div>
        )}
      </div>

      {/* File info — text selectable, does NOT trigger preview */}
      <div className="p-2.5 sm:p-3.5">
        <p
          className="text-xs sm:text-sm font-medium text-slate-200 truncate mb-1 sm:mb-1.5 select-none"
          title={file.name}
        >
          <span
            className="select-text cursor-text"
            onClick={(e) => e.stopPropagation()}
          >
            {file.name}
          </span>
        </p>
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
          {file.isFolder ? (
            <span>{file.folderItemCount ?? 0} 项</span>
          ) : (
            <span>{formatFileSize(file.size)}</span>
          )}
          <span>{formatDate(file.lastModified)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export const FileCard = memo(FileCardRaw);
