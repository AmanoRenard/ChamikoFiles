"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="glass-card p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  danger ? "bg-red-500/10" : "bg-primary/10"
                }`}
              >
                <AlertTriangle
                  size={20}
                  className={danger ? "text-red-400" : "text-primary-light"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={onCancel}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  danger
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20"
                    : "bg-primary/20 text-primary-light hover:bg-primary/30 border border-primary/20"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
