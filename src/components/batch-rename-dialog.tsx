"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { FileInfo, SequenceType, RenamePreviewItem } from "@/types";
import { formatDateForFilename, getFileExtension, getFileNameWithoutExt } from "@/lib/file-utils";

interface BatchRenameDialogProps {
  open: boolean;
  files: FileInfo[];
  onRename: (items: { oldName: string; newName: string }[]) => void;
  onClose: () => void;
}

type SortMethod = "date" | "name" | "size" | "type";

const SORT_LABELS: Record<SortMethod, string> = {
  date: "时间",
  name: "名称",
  size: "大小",
  type: "类型",
};

export function BatchRenameDialog({ open, files, onRename, onClose }: BatchRenameDialogProps) {
  const [baseName, setBaseName] = useState("");
  const [separator, setSeparator] = useState("_");
  const [sequenceType, setSequenceType] = useState<SequenceType>("number");
  const [sortMethod, setSortMethod] = useState<SortMethod>("date");

  // 重命名预览
  const preview = useMemo((): RenamePreviewItem[] => {
    if (files.length === 0) return [];

    // 基础名为空时不加分隔符，直接拼接序号/时间戳
    const prefix = baseName.trim() ? `${baseName.trim()}${separator}` : "";

    const sorted = [...files].sort((a, b) => {
      const typeRank = (f: FileInfo) => {
        if (f.isFolder) return 0;
        if (f.isImage) return 1;
        if (f.isVideo) return 2;
        if (f.isAudio) return 3;
        if (f.isText) return 4;
        return 5;
      };

      let cmp = 0;
      switch (sortMethod) {
        case "name":
          cmp = a.name.localeCompare(b.name, "zh-CN");
          break;
        case "size":
          cmp = a.size - b.size;
          break;
        case "date":
          cmp = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
          break;
        case "type":
          cmp = typeRank(a) - typeRank(b) || a.name.localeCompare(b.name, "zh-CN");
          break;
      }
      return cmp;
    });

    // 补零位数
    const totalCount = sorted.length;
    const padLength = totalCount >= 1000 ? 4 : totalCount >= 100 ? 3 : totalCount >= 10 ? 2 : 1;

    if (sequenceType === "number") {
      return sorted.map((f, idx) => {
        const ext = getFileExtension(f.name);
        const seq = String(idx + 1).padStart(padLength, "0");
        const newName = `${prefix}${seq}${ext}`;
        return { oldName: f.name, newName, ext };
      });
    }

    // timestamp 类型
    // 分组: 同一时间戳的放在一组，组内按类型排序后编号
    const groups = new Map<string, FileInfo[]>();
    for (const f of sorted) {
      const ts = formatDateForFilename(f.lastModified);
      if (!groups.has(ts)) groups.set(ts, []);
      groups.get(ts)!.push(f);
    }

    const results: RenamePreviewItem[] = [];
    for (const [ts, groupFiles] of groups) {
      if (groupFiles.length === 1) {
        const f = groupFiles[0];
        const ext = getFileExtension(f.name);
        results.push({
          oldName: f.name,
          newName: `${prefix}${ts}${ext}`,
          ext,
        });
      } else {
        // 重复的按类型排序
        const typeRank = (f: FileInfo) => {
          if (f.isFolder) return 0;
          if (f.isImage) return 1;
          if (f.isVideo) return 2;
          if (f.isAudio) return 3;
          if (f.isText) return 4;
          return 5;
        };
        const subSorted = [...groupFiles].sort(
          (a, b) => typeRank(a) - typeRank(b) || a.name.localeCompare(b.name, "zh-CN")
        );
        const subPad = groupFiles.length >= 100 ? 3 : groupFiles.length >= 10 ? 2 : 1;
        subSorted.forEach((f, idx) => {
          const ext = getFileExtension(f.name);
          const sub = String(idx + 1).padStart(subPad, "0");
          results.push({
            oldName: f.name,
            newName: `${prefix}${ts}_${sub}${ext}`,
            ext,
          });
        });
      }
    }

    return results;
  }, [files, baseName, separator, sequenceType, sortMethod]);

  // 检查命名冲突
  const hasConflict = useMemo(() => {
    const newNames = new Set<string>();
    for (const p of preview) {
      if (newNames.has(p.newName)) return true;
      newNames.add(p.newName);
    }
    return false;
  }, [preview]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl mx-4 max-h-[85vh] glass-card border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <h3 className="text-base font-semibold text-slate-200">批量重命名</h3>
              <p className="text-xs text-slate-500 mt-0.5">{files.length} 个文件</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-all"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          {/* Config */}
          <div className="p-5 space-y-4 border-b border-white/[0.04] flex-shrink-0">
            {/* Base name + separator */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1.5 block">基础名</label>
                <input
                  type="text"
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  placeholder="输入基础名..."
                  className="w-full h-9 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-slate-500 mb-1.5 block">分隔符</label>
                <input
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value.substring(0, 3))}
                  maxLength={3}
                  className="w-full h-9 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 text-center focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            {/* Sequence type + sort */}
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">序号类型</label>
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                  <button
                    onClick={() => setSequenceType("number")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sequenceType === "number"
                        ? "bg-primary/20 text-primary-light"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    数字
                  </button>
                  <button
                    onClick={() => setSequenceType("timestamp")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sequenceType === "timestamp"
                        ? "bg-primary/20 text-primary-light"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    上传时间
                  </button>
                </div>
              </div>

              {sequenceType === "number" && (
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">排序方式</label>
                  <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                    {(Object.keys(SORT_LABELS) as SortMethod[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setSortMethod(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          sortMethod === key
                            ? "bg-primary/20 text-primary-light"
                            : "text-slate-400 hover:text-slate-300"
                        }`}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3">
            <p className="text-xs text-slate-500 mb-2">
              预览 ({preview.length} 个文件)
              {hasConflict && (
                <span className="text-amber-400 ml-2">⚠ 存在命名冲突</span>
              )}
            </p>
            <div className="border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 w-[45%]">
                      原文件名
                    </th>
                    <th className="text-center px-2 py-2 text-xs font-medium text-slate-500 w-[10%]">
                      <ArrowRight size={12} className="inline" />
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 w-[45%]">
                      新文件名
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-white/[0.03] ${
                        idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                      }`}
                    >
                      <td className="px-3 py-2 text-slate-400 truncate max-w-[180px] text-xs">
                        {item.oldName}
                      </td>
                      <td className="px-2 py-2 text-center text-slate-600">
                        →
                      </td>
                      <td
                        className={`px-3 py-2 truncate max-w-[180px] text-xs ${
                          item.oldName === item.newName
                            ? "text-slate-500 line-through"
                            : "text-primary-light/80"
                        }`}
                      >
                        {item.newName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.06] flex-shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
            >
              取消
            </button>
            <button
              onClick={() => {
                const items = preview
                  .filter((p) => p.oldName !== p.newName)
                  .map((p) => ({ oldName: p.oldName, newName: p.newName }));
                onRename(items);
              }}
              disabled={hasConflict || preview.every((p) => p.oldName === p.newName)}
              className="px-4 py-2 rounded-xl bg-primary/20 text-primary-light text-xs font-medium hover:bg-primary/30 border border-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              批量重命名
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
