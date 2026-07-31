"use client";

import { FileInfo } from "@/types";
import { useEffect, useRef, useCallback } from "react";
import { X, Download } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/hooks/useScrollLock";

const VOLUME_KEY = "chamiko-video-volume";

function getSavedVolume(): number {
  try {
    const v = localStorage.getItem(VOLUME_KEY);
    return v !== null ? parseFloat(v) : 1;
  } catch {
    return 1;
  }
}

function saveVolume(volume: number) {
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    // ignore
  }
}

interface VideoPreviewProps {
  file: FileInfo | null;
  subpath: string;
  onClose: () => void;
}

export function VideoPreview({ file, subpath, onClose }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Apply saved volume on mount
  useEffect(() => {
    if (file && videoRef.current) {
      videoRef.current.volume = getSavedVolume();
    }
  }, [file]);

  // Lock scroll with compensation
  useScrollLock(!!file);

  // Keyboard handling
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!file) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const el = videoRef.current;
        if (el) { el.pause(); el.controls = false; }
        if (backdropRef.current) backdropRef.current.style.pointerEvents = "none";
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [file]);

  const handleVolumeChange = useCallback(() => {
    if (videoRef.current) {
      saveVolume(videoRef.current.volume);
    }
  }, []);

  const handleClose = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.controls = false;
    }
    if (backdropRef.current) backdropRef.current.style.pointerEvents = "none";
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          key={file.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          ref={backdropRef}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-xl"
          onClick={handleClose}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Download */}
          <a
            href={`/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}`}
            download
            className="absolute top-6 right-20 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
          >
            <Download size={18} className="text-white" />
          </a>

          {/* Video */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, mass: 0.6 }}
            className="max-w-[90vw] max-h-[85vh] !transition-none"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={`/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}`}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl"
              onVolumeChange={handleVolumeChange}
            >
              您的浏览器不支持视频播放
            </video>
          </motion.div>

          {/* File name */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/70 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm max-w-[80vw] truncate select-text">
            {file.name}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
