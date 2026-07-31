import { FileInfo } from "@/types";

export const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico", ".avif", ".heic",
]);

export const VIDEO_EXTENSIONS = new Set([
  ".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv", ".m4v", ".3gp",
]);

export const AUDIO_EXTENSIONS = new Set([
  ".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".opus",
]);

export const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".json", ".xml", ".csv", ".log", ".yaml", ".yml",
  ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".scss", ".less",
  ".py", ".java", ".c", ".cpp", ".h", ".hpp", ".rs", ".go", ".rb",
  ".php", ".sql", ".sh", ".bat", ".ps1", ".ini", ".cfg", ".env",
  ".vue", ".svelte", ".astro", ".toml",
]);

// 文档类：纯文本/标记/表格/Office，不含代码文件
export const DOCUMENT_EXTENSIONS = new Set([
  ".txt", ".md", ".csv", ".xml", ".log", ".yaml", ".yml",
  ".ini", ".cfg", ".env", ".toml",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
]);

export function isImageFile(filename: string): boolean {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = filename.slice(dotIndex).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export function isVideoFile(filename: string): boolean {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = filename.slice(dotIndex).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
}

export function isAudioFile(filename: string): boolean {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = filename.slice(dotIndex).toLowerCase();
  return AUDIO_EXTENSIONS.has(ext);
}

export function isTextFile(filename: string): boolean {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = filename.slice(dotIndex).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

export function isDocumentFile(filename: string): boolean {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = filename.slice(dotIndex).toLowerCase();
  return DOCUMENT_EXTENSIONS.has(ext);
}

export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + units[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  if (y === now.getFullYear()) {
    return `${m}-${d} ${h}:${min}`;
  }
  return `${y}-${m}-${d}`;
}

export function getFileTypeIcon(ext: string): string {
  const iconMap: Record<string, string> = {
    ".pdf": "file-text",
    ".doc": "file-text",
    ".docx": "file-text",
    ".xls": "file-spreadsheet",
    ".xlsx": "file-spreadsheet",
    ".ppt": "presentation",
    ".pptx": "presentation",
    ".zip": "file-archive",
    ".rar": "file-archive",
    ".7z": "file-archive",
    ".tar": "file-archive",
    ".gz": "file-archive",
    ".mp3": "music",
    ".wav": "music",
    ".flac": "music",
    ".aac": "music",
    ".mp4": "video",
    ".mkv": "video",
    ".avi": "video",
    ".mov": "video",
    ".webm": "video",
    ".js": "file-code",
    ".ts": "file-code",
    ".jsx": "file-code",
    ".tsx": "file-code",
    ".html": "file-code",
    ".css": "file-code",
    ".json": "file-code",
    ".py": "file-code",
    ".java": "file-code",
    ".txt": "file-text",
    ".md": "file-text",
  };
  return iconMap[ext] || "file";
}

// 将日期字符串格式化为文件名时间戳格式: yyyyMMdd_HHmmss
export function formatDateForFilename(dateString: string): string {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}${M}${d}_${h}${m}${s}`;
}

// 从文件名中提取扩展名（不含点）
export function getFileExt(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex + 1).toLowerCase();
}

// 从文件名中提取不带扩展名的部分
export function getFileNameWithoutExt(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return filename;
  return filename.slice(0, dotIndex);
}

export function getMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".avif": "image/avif",
    ".pdf": "application/pdf",
    ".json": "application/json",
    ".zip": "application/zip",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
  };
  return mimeMap[ext] || "application/octet-stream";
}
