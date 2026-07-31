"use client";

import { Upload, X } from "lucide-react";
import { useCallback, useRef, useState, DragEvent } from "react";
import { UploadProgress as UploadProgressType } from "@/types";

interface UploadZoneProps {
  onUpload: (files: File[], onProgress: (fileName: string, progress: number) => void) => void;
  uploading: boolean;
}

export function UploadZone({ onUpload, uploading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onUpload(files, () => {});
      }
    },
    [onUpload]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files, () => {});
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 ${
        isDragging
          ? "drop-zone-active scale-[1.01]"
          : "border-white/10 hover:border-primary/40 hover:bg-white/[0.02]"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <div className={`flex flex-col items-center gap-4 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragging
              ? "bg-primary/20 shadow-lg shadow-primary/20"
              : "bg-white/[0.03]"
          }`}
        >
          <Upload
            size={28}
            className={isDragging ? "text-primary-light animate-bounce" : "text-slate-400"}
          />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-300">
            {isDragging ? "松开以上传文件" : "拖拽文件到此处或点击上传"}
          </p>
          <p className="text-sm text-slate-500 mt-1.5">
            支持批量上传，单个文件最大 500MB
          </p>
        </div>
      </div>
    </div>
  );
}
