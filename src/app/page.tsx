"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { FileInfo, FileListResponse, UploadProgress } from "@/types";
import { FileCard } from "@/components/file-card";
import { FileRow } from "@/components/file-row";
import { ImagePreview } from "@/components/image-preview";
import { VideoPreview } from "@/components/video-preview";
import { TextPreview } from "@/components/text-preview";
import { AudioPreview } from "@/components/audio-preview";
import { FileInfoDialog } from "@/components/file-info-dialog";
import { SearchBar } from "@/components/search-bar";
import { ViewToggle } from "@/components/view-toggle";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { ContextMenu, getFileContextMenuItems, getBatchContextMenuItems } from "@/components/context-menu";
import { UploadProgressList } from "@/components/upload-progress";
import { useToast } from "@/components/toast-provider";
import { useAuth } from "@/components/auth-provider";
import { MoveDialog } from "@/components/move-dialog";
import { BatchRenameDialog } from "@/components/batch-rename-dialog";
import { SpaceSidebar } from "@/components/space-sidebar";
import { SpaceSelector } from "@/components/space-selector";
import { useSpaces } from "@/hooks/use-spaces";
import { readConfig } from "@/lib/config";
import { AnimatePresence, motion } from "framer-motion";
import { FolderOpen, ChevronLeft, ChevronRight, X, Loader2, Upload, MoreHorizontal } from "lucide-react";

export default function HomePage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const {
    spaces,
    currentSpace,
    currentSpaceId,
    currentSpaceType,
    currentPath,
    isOwner,
    loading: spacesLoading,
    switchToSpace,
    navigateToPath,
    fetchSpaces,
  } = useSpaces();

  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [previewMode, setPreviewMode] = useState<"image" | "video" | "audio" | "text" | "file">("image");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileInfo | null>(null);
  const [renameName, setRenameName] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const isSelectMode = selectedItems.size > 0;

  const [moveTarget, setMoveTarget] = useState<FileInfo | null>(null);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const [batchRenameOpen, setBatchRenameOpen] = useState(false);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; file: FileInfo;
  } | null>(null);

  const [batchActionMenuOpen, setBatchActionMenuOpen] = useState(false);
  const batchActionBtnRef = useRef<HTMLButtonElement>(null);

  const [uploadProgressItems, setUploadProgressItems] = useState<UploadProgress[]>([]);
  const xhrRefs = useRef<Map<string, XMLHttpRequest>>(new Map());
  const uploadingRef = useRef(false);
  const fabInputRef = useRef<HTMLInputElement>(null);

  // Build API base params
  const spaceParams = useMemo(
    () => `spaceType=${currentSpaceType}&spaceId=${currentSpaceId}`,
    [currentSpaceType, currentSpaceId]
  );

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "50",
      search: searchQuery,
      sortBy,
      sortOrder,
      subpath: currentPath,
      spaceType: currentSpaceType,
      spaceId: currentSpaceId,
    });
    const res = await fetch(`/api/files/list?${params}`);
    const data: { success: boolean; data: FileListResponse } = await res.json();
    if (data.success) {
      setFiles(data.data.files);
      setTotalPages(data.data.totalPages);
      setTotal(data.data.total);
    }
    setLoading(false);
  }, [page, searchQuery, sortBy, sortOrder, currentPath, currentSpaceType, currentSpaceId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (!uploading && uploadProgressItems.length === 0) {
      fetchFiles();
    }
  }, [uploading, uploadProgressItems.length]);

  useEffect(() => {
    setPage(1);
  }, [currentPath, searchQuery, currentSpaceId]);

  // ESC to exit select mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (renameTarget || moveTarget || batchMoveOpen || batchRenameOpen || batchDeleteConfirm || deleteTarget) return;
      setSelectedItems(new Set());
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [renameTarget, moveTarget, batchMoveOpen, batchRenameOpen, batchDeleteConfirm, deleteTarget]);

  // Close batch action menu when selection clears
  useEffect(() => {
    if (selectedItems.size === 0) {
      setBatchActionMenuOpen(false);
    }
  }, [selectedItems.size]);

  // Restore preferences
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  useEffect(() => {
    const vm = localStorage.getItem("chamiko-view-mode");
    if (vm === "list" || vm === "grid") setViewMode(vm);
    const sb = localStorage.getItem("chamiko-sort-by");
    if (sb) setSortBy(sb);
    const so = localStorage.getItem("chamiko-sort-order");
    if (so === "asc" || so === "desc") setSortOrder(so);
    setPrefsLoaded(true);
  }, []);
  useEffect(() => { if (prefsLoaded) localStorage.setItem("chamiko-view-mode", viewMode); }, [viewMode, prefsLoaded]);
  useEffect(() => { if (prefsLoaded) localStorage.setItem("chamiko-sort-by", sortBy); }, [sortBy, prefsLoaded]);
  useEffect(() => { if (prefsLoaded) localStorage.setItem("chamiko-sort-order", sortOrder); }, [sortOrder, prefsLoaded]);

  // Upload
  const handleUpload = useCallback(
    (uploadFiles: File[]) => {
      if (uploadingRef.current) return;
      uploadingRef.current = true;
      setUploading(true);

      const initialProgress: UploadProgress[] = uploadFiles.map((f) => ({
        fileName: f.name,
        progress: 0,
        status: "uploading" as const,
      }));
      setUploadProgressItems(initialProgress);

      const xhr = new XMLHttpRequest();
      const uploadUrl = `/api/files/upload?subpath=${encodeURIComponent(currentPath)}&${spaceParams}`;
      xhr.open("POST", uploadUrl);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100;
          setUploadProgressItems((prev) =>
            prev.map((item) => ({
              ...item,
              progress: Math.min(Math.round(pct), 100),
            }))
          );
        }
      });

      const formData = new FormData();
      uploadFiles.forEach((f) => formData.append("files", f));

      xhr.addEventListener("load", () => {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.success) {
            const { uploaded, errors } = result.data;
            setUploadProgressItems((prev) =>
              prev.map((item) => ({
                ...item,
                status: uploaded?.includes(item.fileName) ? "done" : "error",
                error: errors?.find((e: string) => e.startsWith(item.fileName)),
              }))
            );
            if (uploaded && uploaded.length > 0) {
              addToast(`成功上传 ${uploaded.length} 个文件`, "success");
            }
            if (errors && errors.length > 0) {
              errors.forEach((err: string) => addToast(err, "error"));
            }
          } else {
            addToast(result.error || "上传失败", "error");
          }
        } catch {
          addToast("上传响应解析失败", "error");
        }
        setTimeout(() => {
          setUploadProgressItems([]);
          setUploading(false);
          uploadingRef.current = false;
        }, 2000);
      });

      xhr.addEventListener("error", () => {
        addToast("上传失败，网络错误", "error");
        setUploadProgressItems([]);
        setUploading(false);
        uploadingRef.current = false;
      });

      xhr.send(formData);
    },
    [currentPath, spaceParams, addToast]
  );

  const handleCancelUpload = useCallback((fileName: string) => {
    const xhr = xhrRefs.current.get(fileName);
    if (xhr) {
      xhr.abort();
      xhrRefs.current.delete(fileName);
    }
    setUploadProgressItems((prev) =>
      prev.map((item) =>
        item.fileName === fileName ? { ...item, status: "error" as const, error: "已取消" } : item
      )
    );
  }, []);

  // Global drag-and-drop
  const handleUploadRef = useRef(handleUpload);
  handleUploadRef.current = handleUpload;
  useEffect(() => {
    const onDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      const droppedFiles = e.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        handleUploadRef.current(Array.from(droppedFiles));
      }
    };
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  // Folder navigation
  const handleOpenFolder = useCallback(
    (folderName: string) => {
      const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      navigateToPath(newPath);
      setSelectedItems(new Set());
    },
    [currentPath, navigateToPath]
  );

  // Create folder
  const handleCreateFolder = useCallback(
    async (name: string) => {
      const res = await fetch("/api/files/mkdir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderName: name,
          subpath: currentPath,
          spaceType: currentSpaceType,
          spaceId: currentSpaceId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        addToast(`已创建文件夹: ${name}`, "success");
        fetchFiles();
      } else {
        addToast(result.error || "创建失败", "error");
      }
    },
    [currentPath, currentSpaceType, currentSpaceId, addToast, fetchFiles]
  );

  const fileOnDelete = useCallback((name: string) => setDeleteTarget(name), []);

  // Delete
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const res = await fetch(
      `/api/files/delete?name=${encodeURIComponent(deleteTarget)}&subpath=${encodeURIComponent(currentPath)}&${spaceParams}`,
      { method: "DELETE" }
    );
    const result = await res.json();
    if (result.success) {
      addToast(`已删除: ${deleteTarget}`, "success");
      setFiles((prev) => prev.filter((f) => f.name !== deleteTarget));
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget);
        return next;
      });
    } else {
      addToast(result.error || "删除失败", "error");
    }
    setDeleteTarget(null);
  }, [deleteTarget, currentPath, spaceParams, addToast]);

  // Batch delete
  const handleBatchDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;
    const res = await fetch("/api/files/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: Array.from(selectedItems),
        subpath: currentPath,
        spaceType: currentSpaceType,
        spaceId: currentSpaceId,
      }),
    });
    const result = await res.json();
    if (result.success) {
      addToast(`已删除 ${result.data.deleted.length} 个项目`, "success");
      if (result.data.errors.length > 0) {
        result.data.errors.forEach((e: string) => addToast(e, "error"));
      }
      setSelectedItems(new Set());
      setBatchDeleteConfirm(false);
      fetchFiles();
    } else {
      addToast(result.error || "批量删除失败", "error");
    }
  }, [selectedItems, currentPath, currentSpaceType, currentSpaceId, addToast, fetchFiles]);

  // Rename
  const handleRename = useCallback(async () => {
    if (!renameTarget || !renameName.trim()) return;
    const res = await fetch("/api/files/rename", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldName: renameTarget.name,
        newName: renameName.trim(),
        subpath: currentPath,
        spaceType: currentSpaceType,
        spaceId: currentSpaceId,
      }),
    });
    const result = await res.json();
    if (result.success) {
      addToast(`已重命名为: ${renameName.trim()}`, "success");
      setRenameTarget(null);
      fetchFiles();
    } else {
      addToast(result.error || "重命名失败", "error");
    }
  }, [renameTarget, renameName, currentPath, currentSpaceType, currentSpaceId, addToast, fetchFiles]);

  // Move file
  const handleMoveFile = useCallback(
    async (targetPath: string) => {
      if (!moveTarget) return;
      if (targetPath === currentPath) {
        addToast("目标路径与当前路径相同", "error");
        return;
      }
      const res = await fetch("/api/files/move", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: moveTarget.name,
          subpath: currentPath,
          targetSubpath: targetPath,
          spaceType: currentSpaceType,
          spaceId: currentSpaceId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        addToast(`已移动: ${moveTarget.name}`, "success");
        setMoveTarget(null);
        fetchFiles();
      } else {
        addToast(result.error || "移动失败", "error");
      }
    },
    [moveTarget, currentPath, currentSpaceType, currentSpaceId, addToast, fetchFiles]
  );

  // Batch move
  const handleBatchMove = useCallback(
    async (targetPath: string) => {
      if (targetPath === currentPath) {
        addToast("目标路径与当前路径相同", "error");
        return;
      }
      const res = await fetch("/api/files/batch-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Array.from(selectedItems),
          subpath: currentPath,
          targetSubpath: targetPath,
          spaceType: currentSpaceType,
          spaceId: currentSpaceId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        addToast(`已移动 ${result.data.moved.length} 个项目`, "success");
        if (result.data.errors.length > 0) {
          result.data.errors.forEach((e: string) => addToast(e, "error"));
        }
        setBatchMoveOpen(false);
        setSelectedItems(new Set());
        fetchFiles();
      } else {
        addToast(result.error || "批量移动失败", "error");
      }
    },
    [selectedItems, currentPath, currentSpaceType, currentSpaceId, addToast, fetchFiles]
  );

  // Batch rename
  const handleBatchRename = useCallback(
    async (items: { oldName: string; newName: string }[]) => {
      if (items.length === 0) return;
      const res = await fetch("/api/files/batch-rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          subpath: currentPath,
          spaceType: currentSpaceType,
          spaceId: currentSpaceId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        addToast(`已重命名 ${result.data.renamed.length} 个项目`, "success");
        if (result.data.errors.length > 0) {
          result.data.errors.forEach((e: string) => addToast(e, "error"));
        }
        setBatchRenameOpen(false);
        setSelectedItems(new Set());
        fetchFiles();
      } else {
        addToast(result.error || "批量重命名失败", "error");
      }
    },
    [currentPath, currentSpaceType, currentSpaceId, addToast, fetchFiles]
  );

  const downloadUrl = useCallback(
    (name: string) =>
      `/api/files/download?name=${encodeURIComponent(name)}&subpath=${encodeURIComponent(currentPath)}&${spaceParams}&download=1`,
    [currentPath, spaceParams]
  );

  // Batch download
  const handleBatchDownload = useCallback(async () => {
    if (selectedItems.size === 0) return;
    // Single file: direct download, no zip
    if (selectedItems.size === 1) {
      const name = Array.from(selectedItems)[0];
      window.open(downloadUrl(name), "_blank");
      setSelectedItems(new Set());
      return;
    }
    const res = await fetch("/api/files/batch-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: Array.from(selectedItems),
        subpath: currentPath,
        spaceType: currentSpaceType,
        spaceId: currentSpaceId,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      addToast(err.error || "下载失败", "error");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-download-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSelectedItems(new Set());
  }, [selectedItems, currentPath, currentSpaceType, currentSpaceId, addToast, downloadUrl]);

  // Preview
  const previewFileRef = useRef<FileInfo | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);
  const handlePreviewClose = useCallback(() => {
    setPreviewNonce((n) => n + 1);
    setPreviewFile(null);
  }, []);

  const handlePreview = useCallback(
    (file: FileInfo) => {
      if (previewFileRef.current?.name === file.name) {
        setPreviewNonce((n) => n + 1);
      }
      if (file.isImage) { previewFileRef.current = file; setPreviewFile(file); setPreviewMode("image"); }
      else if (file.isVideo) { previewFileRef.current = file; setPreviewFile(file); setPreviewMode("video"); }
      else if (file.isAudio) { previewFileRef.current = file; setPreviewFile(file); setPreviewMode("audio"); }
      else if (file.isText) { previewFileRef.current = file; setPreviewFile(file); setPreviewMode("text"); }
      else { previewFileRef.current = file; setPreviewFile(file); setPreviewMode("file"); }
    },
    [currentPath]
  );

  // Multi-select
  const toggleSelect = useCallback((name: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); } else { next.add(name); }
      return next;
    });
  }, []);

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, file: FileInfo) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  }, []);

  const handleCopyLink = useCallback(
    (file: FileInfo) => {
      const url = `${window.location.origin}/api/files/download?name=${encodeURIComponent(file.name)}&subpath=${encodeURIComponent(currentPath)}&${spaceParams}`;
      navigator.clipboard.writeText(url);
      addToast("已复制下载链接", "info");
    },
    [currentPath, spaceParams, addToast]
  );

  // Filter
  const displayFiles = useMemo(() => {
    switch (filterType) {
      case "image": return files.filter((f) => f.isImage);
      case "video": return files.filter((f) => f.isVideo);
      case "audio": return files.filter((f) => f.isAudio);
      case "document": return files.filter((f) => f.isDocument);
      case "other": return files.filter((f) => !f.isFolder && !f.isImage && !f.isVideo && !f.isAudio && !f.isDocument);
      default: return files;
    }
  }, [files, filterType]);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === displayFiles.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(displayFiles.map((f) => f.name)));
    }
  }, [selectedItems, displayFiles]);

  const imageFiles = useMemo(() => files.filter((f) => f.isImage), [files]);

  // AuthProvider now handles redirect for unauthenticated users
  // so this page only renders when user is authenticated

  const canCreateMore =
    spaces.filter((s) => s.type === "shared" && s.role === "owner").length < 3;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Space Sidebar (desktop) */}
      <SpaceSidebar
        spaces={spaces}
        currentSpaceId={currentSpaceId}
        currentSpaceType={currentSpaceType}
        canCreateMore={canCreateMore}
        maxSharedSpaces={3}
        loading={spacesLoading}
        onSwitchSpace={switchToSpace}
        onSpaceUpdated={fetchSpaces}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-3 sm:px-6 lg:px-8 pb-3 sm:pb-5 flex flex-col min-h-full">
          {/* Upload progress */}
          <AnimatePresence>
            {uploadProgressItems.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <UploadProgressList items={uploadProgressItems} onCancel={handleCancelUpload} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breadcrumb + Toolbar — unified glass background */}
          <div className="sm:sticky sm:top-0 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-2 sm:pb-2.5 mb-3 sm:mb-5 bg-surface-dark/95 border-b border-white/[0.06]">
            <div className="space-y-1.5">
              {/* Breadcrumb + Space selector (mobile) */}
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <SpaceSelector
                    spaces={spaces}
                    currentSpace={currentSpace}
                    currentSpaceId={currentSpaceId}
                    currentSpaceType={currentSpaceType}
                    onSwitchSpace={switchToSpace}
                    onSpaceUpdated={fetchSpaces}
                  />
                </div>
                <Breadcrumb
                  path={currentPath}
                  onNavigate={navigateToPath}
                  spaceName={currentSpace?.name || "根目录"}
                />
              </div>

              {/* 分隔线 */}
              <div className="border-b border-white/[0.04]" />

              {/* Toolbar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <SearchBar
                  onSearch={setSearchQuery}
                  onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onCreateFolder={handleCreateFolder}
                  onSelectAll={handleSelectAll}
                  filterType={filterType}
                  onFilterChange={setFilterType}
                  onUpload={(fileList) => { handleUpload(Array.from(fileList)); }}
                  loaded={prefsLoaded}
                />
                <ViewToggle viewMode={viewMode} onChange={setViewMode} loaded={prefsLoaded} />
                <span className="text-xs text-slate-500 ml-auto hidden sm:block">共 {total} 项</span>
              </div>
            </div>
          </div>

          {/* Rename dialog */}
          <AnimatePresence>
            {renameTarget && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                <div className="glass-card px-4 py-3 flex items-center gap-3">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenameTarget(null); }}
                    placeholder={renameTarget.name}
                    className="flex-1 h-9 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/40 transition-all"
                    autoFocus
                  />
                  <button onClick={handleRename} className="px-4 py-2 rounded-xl bg-primary/20 text-primary-light text-sm font-medium hover:bg-primary/30 transition-all border border-primary/20">确认</button>
                  <button onClick={() => setRenameTarget(null)} className="px-3 py-2 rounded-xl hover:bg-white/[0.04] text-sm text-slate-400 transition-all">取消</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File list */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : displayFiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] select-none">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-4">
                <FolderOpen size={36} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">{searchQuery ? "没有匹配的文件" : "还没有文件"}</p>
              <p className="text-sm text-slate-600 mt-1">{searchQuery ? "试试其他关键词" : "拖拽文件到上方区域开始上传"}</p>
            </div>
          ) : viewMode === "grid" ? (
            <motion.div layout key={filterType} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {displayFiles.map((file) => (
                  <motion.div key={file.name} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                    <FileCard
                      file={file}
                      subpath={currentPath}
                      isSelectMode={isSelectMode}
                      selected={selectedItems.has(file.name)}
                      onToggleSelect={toggleSelect}
                      onDelete={fileOnDelete}
                      onPreview={handlePreview}
                      onOpenFolder={handleOpenFolder}
                      onContextMenu={handleContextMenu}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="space-y-2" key={filterType}>
              <AnimatePresence mode="popLayout">
                {displayFiles.map((file) => (
                  <motion.div key={file.name} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                    <FileRow
                      file={file}
                      subpath={currentPath}
                      isSelectMode={isSelectMode}
                      selected={selectedItems.has(file.name)}
                      onToggleSelect={toggleSelect}
                      onDelete={fileOnDelete}
                      onPreview={handlePreview}
                      onOpenFolder={handleOpenFolder}
                      onContextMenu={handleContextMenu}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={16} className="text-slate-400" />
              </button>
              <span className="text-sm text-slate-400">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          )}

          {/* Batch action bar */}
          <AnimatePresence>
            {isSelectMode && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="glass-card px-5 py-3 flex items-center gap-3 shadow-2xl border border-white/[0.08]">
                  <span className="text-sm text-slate-300">已选择 <span className="text-primary-light font-semibold">{selectedItems.size}</span> 项</span>
                  <div className="relative">
                    <button
                      ref={batchActionBtnRef}
                      onClick={() => setBatchActionMenuOpen(!batchActionMenuOpen)}
                      className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center hover:bg-primary/25 transition-all"
                      title="批量操作"
                    >
                      <MoreHorizontal size={15} className="text-primary-light" />
                    </button>
                  </div>
                  <button onClick={() => { setSelectedItems(new Set()); }} className="w-7 h-7 rounded-lg hover:bg-white/[0.04] flex items-center justify-center transition-all">
                    <X size={14} className="text-slate-500" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview modals */}
          <ImagePreview key={`image-${previewNonce}`} file={previewMode === "image" ? previewFile : null} imageFiles={imageFiles} subpath={currentPath} onClose={handlePreviewClose} onNavigate={setPreviewFile} />
          <VideoPreview key={`video-${previewNonce}`} file={previewMode === "video" ? previewFile : null} subpath={currentPath} onClose={handlePreviewClose} />
          <TextPreview key={`text-${previewNonce}`} file={previewMode === "text" ? previewFile : null} subpath={currentPath} onClose={handlePreviewClose} />
          <AudioPreview key={`audio-${previewNonce}`} file={previewMode === "audio" ? previewFile : null} subpath={currentPath} onClose={handlePreviewClose} />
          <FileInfoDialog key={`file-${previewNonce}`} file={previewMode === "file" ? previewFile : null} subpath={currentPath} onClose={handlePreviewClose} />

          {/* Context menu */}
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x} y={contextMenu.y}
              items={
                selectedItems.has(contextMenu.file.name) && selectedItems.size >= 2
                  ? getBatchContextMenuItems({
                      onBatchDownload: handleBatchDownload,
                      onBatchMove: () => { setBatchMoveOpen(true); },
                      onBatchRename: () => { setBatchRenameOpen(true); },
                      onBatchDelete: () => { setBatchDeleteConfirm(true); },
                    })
                  : getFileContextMenuItems(contextMenu.file, {
                      onOpen: () => handleOpenFolder(contextMenu.file.name),
                      onPreview: () => handlePreview(contextMenu.file),
                      onDownload: () => { window.open(downloadUrl(contextMenu.file.name), "_blank"); },
                      onCopyLink: () => handleCopyLink(contextMenu.file),
                      onMove: () => { setMoveTarget(contextMenu.file); },
                      onRename: () => { setRenameTarget(contextMenu.file); setRenameName(contextMenu.file.name); },
                      onDelete: () => setDeleteTarget(contextMenu.file.name),
                    })
              }
              onClose={() => setContextMenu(null)}
            />
          )}

          {/* Delete confirm */}
          <ConfirmDialog open={!!deleteTarget} title="确认删除" message={`确定要删除 "${deleteTarget}" 吗？${files.find((f) => f.name === deleteTarget)?.isFolder ? "文件夹及其所有内容将被永久删除。" : "删除后无法恢复。"}`} confirmText="删除" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />

          {/* Move dialogs */}
          <MoveDialog open={!!moveTarget} itemName={moveTarget?.name || ""} currentPath={currentPath} spaceType={currentSpaceType} spaceId={currentSpaceId} onMove={handleMoveFile} onClose={() => setMoveTarget(null)} />
          <MoveDialog open={batchMoveOpen} itemName={`${selectedItems.size} 个项目`} currentPath={currentPath} spaceType={currentSpaceType} spaceId={currentSpaceId} onMove={handleBatchMove} onClose={() => setBatchMoveOpen(false)} />

          {/* Batch rename dialog */}
          <BatchRenameDialog open={batchRenameOpen} files={displayFiles.filter((f) => selectedItems.has(f.name))} onRename={handleBatchRename} onClose={() => setBatchRenameOpen(false)} />

          {/* Batch delete confirm */}
          <ConfirmDialog open={batchDeleteConfirm} title="确认批量删除" message={`确定要删除选中的 ${selectedItems.size} 个项目吗？此操作不可恢复。`} confirmText="批量删除" onConfirm={handleBatchDelete} onCancel={() => setBatchDeleteConfirm(false)} danger />

          {/* Mobile FAB */}
          <input ref={fabInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files && e.target.files.length > 0) { handleUpload(Array.from(e.target.files)); e.target.value = ""; } }} />
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.9 }}
            onClick={() => fabInputRef.current?.click()}
            className="sm:hidden fixed bottom-6 right-4 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-cyan text-white flex items-center justify-center shadow-xl shadow-primary/30 active:shadow-lg active:shadow-primary/20 transition-shadow"
            title="上传文件"
          >
            <Upload size={22} />
          </motion.button>
        </div>
      </div>

      {/* Batch action menu — portal to body to escape stacking context */}
      {batchActionMenuOpen && batchActionBtnRef.current && typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setBatchActionMenuOpen(false)} />
            <div
              className="fixed z-[9999] w-36 py-1.5 rounded-xl bg-[#1A1530] border border-white/[0.1] shadow-2xl"
              style={{
                left: batchActionBtnRef.current.getBoundingClientRect().right - 144,
                top: batchActionBtnRef.current.getBoundingClientRect().top - 8,
                transform: "translateY(-100%)",
              }}
            >
              <button
                onClick={() => { handleBatchDownload(); setBatchActionMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-all"
              >
                下载
              </button>
              <button
                onClick={() => {
                  if (selectedItems.size === 1) {
                    const f = displayFiles.find((x) => x.name === Array.from(selectedItems)[0]);
                    if (f) setMoveTarget(f);
                  } else {
                    setBatchMoveOpen(true);
                  }
                  setBatchActionMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-all"
              >
                移动
              </button>
              <button
                onClick={() => {
                  if (selectedItems.size === 1) {
                    const f = displayFiles.find((x) => x.name === Array.from(selectedItems)[0]);
                    if (f) { setRenameTarget(f); setRenameName(f.name); }
                  } else {
                    setBatchRenameOpen(true);
                  }
                  setBatchActionMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-all"
              >
                重命名
              </button>
              <button
                onClick={() => {
                  if (selectedItems.size === 1) {
                    setDeleteTarget(Array.from(selectedItems)[0]);
                  } else {
                    setBatchDeleteConfirm(true);
                  }
                  setBatchActionMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-all"
              >
                删除
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
