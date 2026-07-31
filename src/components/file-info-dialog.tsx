"use client";

import { FileInfo } from "@/types";
import { formatFileSize, formatDate, getFileTypeIcon } from "@/lib/file-utils";
import { useEffect, useRef } from "react";
import { X, Download, File, FileText, Archive } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/hooks/useScrollLock";

interface FileInfoDialogProps {
  file: FileInfo | null;
  subpath: string;
  onClose: () => void;
}

export function FileInfoDialog({ file, subpath, onClose }: FileInfoDialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useScrollLock(!!file);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!file) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [file]);

  const downloadUrl = file
    ? `/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}&download=1`
    : "";

  const iconType = file ? getFileTypeIcon(file.ext.toLowerCase()) : "file";

  const iconColor =
    iconType === "file-archive" ? "text-rose-400 bg-rose-500/10"
    : iconType === "file-text" ? "text-blue-400 bg-blue-500/10"
    : iconType === "file-code" ? "text-cyan-400 bg-cyan-500/10"
    : iconType === "file-spreadsheet" ? "text-emerald-400 bg-emerald-500/10"
    : iconType === "presentation" ? "text-orange-400 bg-orange-500/10"
    : "text-slate-400 bg-slate-500/10";

  const renderIcon = () => {
    const cls = `w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`;
    if (iconType === "file-archive") return <div className={cls}><Archive size={20} /></div>;
    if (iconType === "file-text" || iconType === "file-code" || iconType === "file-spreadsheet" || iconType === "presentation")
      return <div className={cls}><FileText size={20} /></div>;
    return <div className={cls}><File size={20} /></div>;
  };

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          key={file.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-xl"
          ref={backdropRef}
          onClick={() => {
            if (backdropRef.current) backdropRef.current.style.pointerEvents = "none";
            onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, mass: 0.6 }}
            className="glass-card w-[90vw] max-w-sm overflow-hidden !transition-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                {renderIcon()}
                <span className="text-sm font-medium text-slate-200 truncate select-text cursor-text">
                  {file.name}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* File details */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">类型</span>
                <span className="text-xs text-slate-300 font-medium">
                  {file.ext.toUpperCase().replace(".", "")} 文件
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">大小</span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">修改时间</span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatDate(file.lastModified)}
                </span>
              </div>
            </div>

            {/* Download button */}
            <div className="px-5 pb-5">
              <a
                href={downloadUrl}
                download={file.name}
                className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary-light text-sm font-medium hover:bg-primary/30 transition-all"
              >
                <Download size={16} />
                下载文件
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
