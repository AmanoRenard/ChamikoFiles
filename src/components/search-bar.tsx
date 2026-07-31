"use client";

import {
  Search,
  ArrowUpDown,
  FolderPlus,
  Image,
  Video,
  Music,
  FileText,
  File,
  LayoutGrid,
  Upload,
  CheckCheck,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onCreateFolder: (name: string) => void;
  onSelectAll: () => void;
  filterType: string;
  onFilterChange: (type: string) => void;
  onUpload?: (files: FileList) => void;
  loaded?: boolean;
}

export function SearchBar({
  onSearch,
  onSortChange,
  sortBy,
  sortOrder,
  onCreateFolder,
  onSelectAll,
  filterType,
  onFilterChange,
  onUpload,
  loaded = true,
}: SearchBarProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderName, setFolderName] = useState("");
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Mobile popover states
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(() => {
    if (showFolderInput) {
      folderInputRef.current?.focus();
    }
  }, [showFolderInput]);

  const sortOptions = [
    { value: "date", label: "时间" },
    { value: "name", label: "名称" },
    { value: "size", label: "大小" },
    { value: "type", label: "类型" },
  ] as const;

  const filterOptions = [
    { value: "all", label: "全部", icon: <LayoutGrid size={13} /> },
    { value: "image", label: "图片", icon: <Image size={13} /> },
    { value: "video", label: "视频", icon: <Video size={13} /> },
    { value: "audio", label: "音频", icon: <Music size={13} /> },
    { value: "document", label: "文档", icon: <FileText size={13} /> },
    { value: "other", label: "其他", icon: <File size={13} /> },
  ];

  const activeFilter = filterOptions.find((f) => f.value === filterType) || filterOptions[0];
  const activeSort = sortOptions.find((s) => s.value === sortBy) || sortOptions[0];

  const handleCreateFolder = () => {
    const name = folderName.trim();
    if (name) {
      onCreateFolder(name);
      setFolderName("");
      setShowFolderInput(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-1.5 flex-1 min-w-0">
      {/* First row — search + filters + sort + actions */}
      <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
      {/* Search */}
      <div className="relative flex-1 min-w-[120px] max-w-full md:w-40 md:flex-shrink-0 md:flex-grow-0 lg:w-48">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
        />
      </div>

      {/* ============ Desktop: full type filter buttons ============ */}
      <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === opt.value
                ? "bg-primary/20 text-primary-light"
                : "text-slate-400 hover:text-slate-300"
            }`}
            title={opt.label}
          >
            {opt.icon}
            <span className="hidden xl:inline whitespace-nowrap">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* ============ Mobile: filter popover ============ */}
      <div className="md:hidden relative" ref={filterRef}>
        <button
          onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); }}
          className={`flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-medium transition-all border min-w-fit ${
            filterOpen || filterType !== "all"
              ? "bg-primary/20 text-primary-light border-primary/30"
              : "bg-white/[0.03] text-slate-400 border-white/[0.06]"
          }`}
        >
          {activeFilter.icon}
          <span>{activeFilter.label}</span>
          {filterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {filterOpen && (
          <div className="absolute top-full left-0 mt-1.5 z-[9999] w-36 py-1.5 rounded-xl bg-surface-dark border border-white/[0.1] shadow-2xl backdrop-blur-xl">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onFilterChange(opt.value);
                  setFilterOpen(false);
                }}
                className={`flex items-center gap-2.5 w-full px-3.5 py-2 text-xs transition-all ${
                  filterType === opt.value
                    ? "text-primary-light bg-primary/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============ Desktop: full sort buttons ============ */}
      <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              if (sortBy === opt.value) {
                onSortChange(opt.value, sortOrder === "asc" ? "desc" : "asc");
              } else {
                onSortChange(opt.value, "desc");
              }
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              loaded && sortBy === opt.value
                ? "bg-primary/20 text-primary-light"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {opt.label}
            {loaded && sortBy === opt.value && (
              <ArrowUpDown size={12} className="inline ml-1" />
            )}
          </button>
        ))}
      </div>

      {/* ============ Mobile: sort popover ============ */}
      <div className="md:hidden relative" ref={sortRef}>
        <button
          onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); }}
          className={`flex items-center gap-1 px-3 h-10 rounded-xl text-xs font-medium transition-all border min-w-fit ${
            sortOpen
              ? "bg-primary/20 text-primary-light border-primary/30"
              : "bg-white/[0.03] text-slate-400 border-white/[0.06]"
          }`}
        >
          <SlidersHorizontal size={13} />
          <span>{activeSort.label}</span>
          {sortOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {sortOpen && (
          <div className="absolute top-full right-0 mt-1.5 z-[9999] w-32 py-1.5 rounded-xl bg-surface-dark border border-white/[0.1] shadow-2xl backdrop-blur-xl">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  if (sortBy === opt.value) {
                    onSortChange(opt.value, sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    onSortChange(opt.value, "desc");
                  }
                  setSortOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-xs text-left transition-all ${
                  sortBy === opt.value
                    ? "text-primary-light bg-primary/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============ Desktop: upload + new folder + select all ============ */}
      {onUpload && (
        <button
          onClick={() => uploadInputRef.current?.click()}
          className="hidden md:flex items-center gap-1.5 px-3 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-primary-light hover:border-primary/30 transition-all"
          title="上传文件"
        >
          <Upload size={16} />
          <span className="text-xs font-medium hidden xl:inline whitespace-nowrap">上传</span>
        </button>
      )}

      <button
        onClick={() => setShowFolderInput(!showFolderInput)}
        className={`hidden md:flex items-center gap-1.5 px-3 h-10 rounded-xl transition-all ${
          showFolderInput
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            : "bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-amber-400 hover:border-amber-500/20"
        }`}
        title="新建文件夹"
      >
        <FolderPlus size={16} />
        <span className="text-xs font-medium hidden xl:inline whitespace-nowrap">新建文件夹</span>
      </button>

      <button
        onClick={onSelectAll}
        className="hidden md:flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-medium transition-all border bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-slate-300 hover:border-primary/30"
      >
        <CheckCheck size={15} />
        <span className="hidden xl:inline whitespace-nowrap">全选</span>
      </button>
      </div>

      {/* ============ Mobile: second row = upload + new folder + select all ============ */}
      <div className="md:hidden w-full flex items-center gap-1.5">
        {/* Upload button */}
        {onUpload && (
          <>
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onUpload(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <button
              onClick={() => uploadInputRef.current?.click()}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-primary-light hover:border-primary/30 transition-all"
              title="上传文件"
            >
              <Upload size={15} />
            </button>
          </>
        )}

        {/* New folder button */}
        <button
          onClick={() => setShowFolderInput(!showFolderInput)}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all border ${
            showFolderInput
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : "bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-amber-400 hover:border-amber-500/20"
          }`}
          title="新建文件夹"
        >
          <FolderPlus size={15} />
        </button>

        {/* Select all button */}
        <button
          onClick={onSelectAll}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-300 hover:border-primary/30 transition-all"
          title="全选"
        >
          <CheckCheck size={15} />
        </button>
      </div>

      {/* Folder name input — shared between mobile & desktop */}
      {showFolderInput && (
        <div className="flex items-center gap-2 w-full max-w-xs">
          <input
            ref={folderInputRef}
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") {
                setShowFolderInput(false);
                setFolderName("");
              }
            }}
            placeholder="输入文件夹名称..."
            className="flex-1 h-10 px-3 rounded-xl bg-white/[0.03] border border-amber-500/30 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 transition-all"
          />
          <button
            onClick={handleCreateFolder}
            className="px-4 h-10 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 border border-amber-500/20 transition-all"
          >
            创建
          </button>
          <button
            onClick={() => {
              setShowFolderInput(false);
              setFolderName("");
            }}
            className="w-8 h-8 rounded-lg hover:bg-white/[0.04] flex items-center justify-center text-slate-500"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
