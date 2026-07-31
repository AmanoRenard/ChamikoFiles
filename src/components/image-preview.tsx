"use client";

import { FileInfo } from "@/types";
import { useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ImagePreviewProps {
  file: FileInfo | null;
  imageFiles: FileInfo[];
  subpath?: string;
  onClose: () => void;
  onNavigate: (file: FileInfo) => void;
}

export function ImagePreview({ file, imageFiles, subpath = "", onClose, onNavigate }: ImagePreviewProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const currentIndex = file ? imageFiles.findIndex((f) => f.name === file.name) : -1;

  const goNext = useCallback(() => {
    if (!file || imageFiles.length === 0) return;
    const next = (currentIndex + 1) % imageFiles.length;
    onNavigate(imageFiles[next]);
  }, [currentIndex, imageFiles, onNavigate, file]);

  const goPrev = useCallback(() => {
    if (!file || imageFiles.length === 0) return;
    const prev = (currentIndex - 1 + imageFiles.length) % imageFiles.length;
    onNavigate(imageFiles[prev]);
  }, [currentIndex, imageFiles, onNavigate, file]);

  // Lock scroll with scrollbar-width compensation
  useScrollLock(!!file);

  // Keyboard nav — separate from scroll lock
  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  goNextRef.current = goNext;
  goPrevRef.current = goPrev;
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNextRef.current();
      if (e.key === "ArrowLeft") goPrevRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); };
  }, [onClose]);

  const getDownloadUrl = (name: string) =>
    `/api/files/download?name=${encodeURIComponent(name)}&subpath=${encodeURIComponent(subpath)}`;

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          key={file.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-xl"
          ref={backdropRef}
          onClick={() => { if (backdropRef.current) backdropRef.current.style.pointerEvents = "none"; onClose(); }}
        >
          {/* Close button */}
          <button
            onClick={() => { if (backdropRef.current) backdropRef.current.style.pointerEvents = "none"; onClose(); }}
            className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-sm text-white/60 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm z-10">
            {currentIndex + 1} / {imageFiles.length}
          </div>

          {/* Download */}
          <a
            href={getDownloadUrl(file.name)}
            download
            className="absolute top-6 right-20 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
          >
            <Download size={18} className="text-white" />
          </a>

          {/* Prev */}
          {imageFiles.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}

          {/* Image */}
          <motion.img
            key={file.name}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            src={getDownloadUrl(file.name)}
            alt={file.name}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {imageFiles.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          )}

          {/* File name */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/70 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm max-w-[80vw] truncate">
            {file.name}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
