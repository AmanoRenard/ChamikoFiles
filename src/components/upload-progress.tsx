"use client";

import { UploadProgress } from "@/types";
import { X, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface UploadProgressListProps {
  items: UploadProgress[];
  onCancel: (fileName: string) => void;
}

export function UploadProgressList({ items, onCancel }: UploadProgressListProps) {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6 space-y-2"
    >
      {items.map((item) => (
        <div
          key={item.fileName}
          className="glass-card px-4 py-3 flex items-center gap-3"
        >
          {/* Status icon */}
          <div className="flex-shrink-0">
            {item.status === "done" ? (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check size={14} className="text-emerald-400" />
              </div>
            ) : item.status === "error" ? (
              <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={14} className="text-red-400" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            )}
          </div>

          {/* Info + Progress bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-300 truncate">{item.fileName}</span>
              {item.status === "uploading" && (
                <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                  {Math.round(item.progress)}%
                </span>
              )}
              {item.status === "error" && (
                <span className="text-xs text-red-400 ml-2 flex-shrink-0">
                  {item.error || "失败"}
                </span>
              )}
            </div>
            {item.status === "uploading" && (
              <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              </div>
            )}
          </div>

          {/* Cancel button */}
          {item.status === "uploading" && (
            <button
              onClick={() => onCancel(item.fileName)}
              className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X size={14} className="text-slate-500 hover:text-red-400" />
            </button>
          )}
        </div>
      ))}
    </motion.div>
  );
}
