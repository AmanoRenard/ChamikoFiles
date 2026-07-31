"use client";

import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
  spaceName?: string;
  onSpaceClick?: () => void;
}

export function Breadcrumb({
  path,
  onNavigate,
  spaceName = "根目录",
  onSpaceClick,
}: BreadcrumbProps) {
  const parts = path.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Space name as root */}
      <button
        onClick={() => {
          onNavigate("");
          onSpaceClick?.();
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
          parts.length === 0
            ? "bg-primary/20 text-primary-light"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
        }`}
      >
        <Home size={14} />
        <span className="max-w-[120px] truncate">{spaceName}</span>
      </button>

      {parts.map((part, idx) => {
        const routePath = parts.slice(0, idx + 1).join("/");
        const isLast = idx === parts.length - 1;

        return (
          <div key={routePath} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-slate-600" />
            <button
              onClick={() => onNavigate(routePath)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all truncate max-w-[160px] ${
                isLast
                  ? "bg-primary/20 text-primary-light"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              {part}
            </button>
          </div>
        );
      })}
    </div>
  );
}
