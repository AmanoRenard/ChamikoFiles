import { FileInfo } from "@/types";
import { getFileExtension, isImageFile, getMimeType, isVideoFile, isAudioFile, isTextFile, isDocumentFile } from "@/lib/file-utils";
import fs from "fs";
import path from "path";

// ============ Space path resolution ============

const STORAGE_BASE = path.resolve(process.cwd(), "data", "storage_base");

/**
 * Resolve the physical path for a space+subpath combination.
 * Personal space: data/storage_base/_user_directory/{userId}/{subpath}
 * Shared space:  data/storage_base/_shared_directory/{spaceId}/{subpath}
 */
export function resolveSpacePath(
  spaceType: string,
  spaceId: string,
  subpath: string = ""
): string {
  const dirName =
    spaceType === "personal" ? "_user_directory" : "_shared_directory";
  const baseDir = path.join(STORAGE_BASE, dirName, spaceId);
  return safeResolvePath(baseDir, subpath);
}

/**
 * Ensure the storage base directory and space root exist.
 */
export function ensureSpaceDirectory(spaceType: string, spaceId: string): void {
  const dirName =
    spaceType === "personal" ? "_user_directory" : "_shared_directory";
  const dir = path.join(STORAGE_BASE, dirName, spaceId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get total storage used by a space directory.
 */
export function getSpaceStorageSize(
  spaceType: string,
  spaceId: string
): { usedSpace: number; fileCount: number } {
  const dirName =
    spaceType === "personal" ? "_user_directory" : "_shared_directory";
  const dir = path.join(STORAGE_BASE, dirName, spaceId);
  if (!fs.existsSync(dir)) return { usedSpace: 0, fileCount: 0 };
  return getTotalStorageSize(dir);
}

/**
 * Recursively delete a space directory.
 */
export function deleteSpaceDirectory(spaceType: string, spaceId: string): void {
  const dirName =
    spaceType === "personal" ? "_user_directory" : "_shared_directory";
  const dir = path.join(STORAGE_BASE, dirName, spaceId);
  if (fs.existsSync(dir)) {
    recursiveDeleteFolder(dir);
  }
}

export function getFileInfo(filePath: string): FileInfo {
  const stats = fs.statSync(filePath);
  const name = path.basename(filePath);
  const ext = getFileExtension(name);
  return {
    name,
    size: stats.size,
    type: getMimeType(ext),
    ext,
    lastModified: stats.mtime.toISOString(),
    isImage: isImageFile(name),
    isFolder: false,
    isVideo: isVideoFile(name),
    isAudio: isAudioFile(name),
    isText: isTextFile(name),
    isDocument: isDocumentFile(name),
  };
}

export function getFolderInfo(folderPath: string): FileInfo {
  const stats = fs.statSync(folderPath);
  const name = path.basename(folderPath);
  let fileCount = 0;
  let totalSize = 0;

  try {
    const entries = fs.readdirSync(folderPath);
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry);
      if (fs.statSync(fullPath).isFile()) {
        fileCount++;
        totalSize += fs.statSync(fullPath).size;
      }
    }
  } catch {
    // skip if can't read
  }

  return {
    name,
    size: totalSize,
    type: "folder",
    ext: "",
    lastModified: stats.mtime.toISOString(),
    isImage: false,
    isFolder: true,
    folderItemCount: fileCount,
    isVideo: false,
    isAudio: false,
    isText: false,
    isDocument: false,
  };
}

export function safeResolvePath(baseDir: string, subpath: string): string {
  const normalized = subpath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  const parts = normalized.split("/").filter(Boolean);
  for (const part of parts) {
    if (part === ".." || part === ".") {
      throw new Error("非法路径");
    }
  }
  const resolved = normalized ? path.join(baseDir, normalized) : baseDir;
  const real = path.resolve(resolved);
  const realBase = path.resolve(baseDir);
  if (!real.startsWith(realBase)) {
    throw new Error("路径穿越检测");
  }
  return resolved;
}

export function recursiveDeleteFolder(folderPath: string): void {
  if (!fs.existsSync(folderPath)) return;
  const entries = fs.readdirSync(folderPath);
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      recursiveDeleteFolder(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(folderPath);
}

export function getTotalStorageSize(baseDir: string): { usedSpace: number; fileCount: number } {
  let usedSpace = 0;
  let fileCount = 0;

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (stat.isFile()) {
          usedSpace += stat.size;
          fileCount++;
        }
      } catch {
        // skip
      }
    }
  }

  walk(baseDir);
  return { usedSpace, fileCount };
}
