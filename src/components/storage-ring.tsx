"use client";

import { motion } from "framer-motion";

interface StorageRingProps {
  usagePercent: number;
  fileCount: number;
  usedSpace: string;
  maxSpace: string;
}

export function StorageRing({ usagePercent, fileCount, usedSpace, maxSpace }: StorageRingProps) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (usagePercent / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center">
        <svg width="48" height="48" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="5"
          />
          {/* Progress circle */}
          <motion.circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="url(#storageGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold gradient-text">{usagePercent}%</span>
        </div>
      </div>
      <div className="hidden sm:block">
        <p className="text-xs text-slate-400">已用 {usedSpace}</p>
        <p className="text-xs text-slate-500">{maxSpace} · {fileCount} 个文件</p>
      </div>
    </div>
  );
}
