"use client";

import { FileInfo } from "@/types";
import { useEffect, useState, useRef } from "react";
import { X, Download, Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/hooks/useScrollLock";

interface TextPreviewProps {
  file: FileInfo | null;
  subpath: string;
  onClose: () => void;
}

export function TextPreview({ file, subpath, onClose }: TextPreviewProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file) {
      setContent("");
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    const url = `/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}`;
    fetch(url, { signal: controller.signal })
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (!cancelled) {
          setContent("无法加载文件内容");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [file, subpath]);

  // Lock scroll with compensation
  useScrollLock(!!file);

  // Keyboard handling
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!file) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); };
  }, [file]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          onClick={() => { if (backdropRef.current) backdropRef.current.style.pointerEvents = "none"; onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, mass: 0.6 }}
            className="glass-card w-[90vw] max-w-4xl max-h-[85vh] flex flex-col overflow-hidden !transition-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-cyan-400">
                    {file.ext.toUpperCase().replace(".", "")}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-200 truncate select-text cursor-text">{file.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleCopy}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                  title="复制内容"
                >
                  {copied ? (
                    <Check size={15} className="text-emerald-400" />
                  ) : (
                    <Copy size={15} className="text-slate-400" />
                  )}
                </button>
                <a
                  href={`/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}`}
                  download
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                  title="下载"
                >
                  <Download size={15} className="text-slate-400" />
                </a>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-5">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <pre className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-all select-text">
                  {content}
                </pre>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
              <span>{file.ext.toUpperCase().replace(".", "")} 文本文件</span>
              <span>{content.length.toLocaleString()} 字符</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
