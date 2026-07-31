"use client";

import { FileInfo } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { X, Music, Download } from "lucide-react";
import { useRef, useEffect, useCallback } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

const VOLUME_KEY = "chamiko-audio-volume";

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

interface AudioPreviewProps {
  file: FileInfo | null;
  subpath: string;
  onClose: () => void;
}

export function AudioPreview({ file, subpath, onClose }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file && audioRef.current) {
      audioRef.current.volume = getSavedVolume();
    }
  }, [file]);

  useScrollLock(!!file);

  const handleVolumeChange = useCallback(() => {
    if (audioRef.current) {
      saveVolume(audioRef.current.volume);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (backdropRef.current) backdropRef.current.style.pointerEvents = "none";
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.controls = false;
    }
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, mass: 0.6 }}
            className="relative w-full max-w-md glass-card p-8 rounded-2xl border border-white/[0.08] shadow-2xl !transition-none"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-all group"
          >
            <X size={16} className="text-slate-400 group-hover:text-slate-200" />
          </button>

          {/* Music icon */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Music size={28} className="text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-slate-200 font-medium text-sm truncate max-w-[280px] select-text cursor-text">
                {file.name}
              </h3>
            </div>
          </div>

          {/* Audio player */}
            <audio
            ref={audioRef}
            controls
            autoPlay
            className="w-full"
            style={{ borderRadius: "0" }}
            onVolumeChange={handleVolumeChange}
          >
            <source src={`/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}`} type={file.type || "audio/mpeg"} />
          </audio>

          {/* Download button */}
          <a
            href={`/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(subpath)}&download=1`}
            className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
          >
            <Download size={15} />
            下载文件
          </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
