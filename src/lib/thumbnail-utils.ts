import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";
import { readConfig } from "@/lib/config";

// ============ Cache path utilities ============

/**
 * Resolve the storage base path, matching the logic in file-utils-server.ts.
 * Duplicated here to avoid circular dependency.
 */
function getStorageBase(): string {
  const config = readConfig();
  const configuredPath = config.storage.path || "";
  if (!configuredPath || !path.isAbsolute(configuredPath)) {
    return path.resolve(process.cwd(), "uploads");
  }
  return configuredPath;
}

/**
 * Get the thumbnail cache root directory.
 * All cached thumbnails are stored under {storageBase}/.thumbnails/
 */
export function getThumbnailDir(): string {
  return path.join(getStorageBase(), ".thumbnails");
}

/**
 * Ensure the thumbnail cache directory exists.
 */
export function ensureThumbnailDir(): void {
  const dir = getThumbnailDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Compute the thumbnail cache file path for a given original file path.
 * Uses SHA256 of the absolute path to avoid special character issues.
 */
export function getThumbnailCachePath(originalPath: string): string {
  const hash = crypto.createHash("sha256").update(path.resolve(originalPath)).digest("hex");
  return path.join(getThumbnailDir(), `${hash}.webp`);
}

// ============ Thumbnail generation ============

/**
 * Generate a thumbnail buffer from an image file using sharp.
 * @param originalPath - Absolute path to the original image file
 * @param width - Target width in pixels (height auto-scaled)
 * @returns WebP buffer
 */
export async function generateThumbnail(
  originalPath: string,
  width: number
): Promise<Buffer> {
  return sharp(originalPath)
    .resize(width, undefined, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Get or generate a thumbnail.
 * Returns cached version if exists, otherwise generates and caches.
 *
 * @param originalPath - Absolute path to the original image file
 * @param width - Target width in pixels
 * @returns Thumbnail buffer and whether it came from cache
 */
export async function getOrGenerateThumbnail(
  originalPath: string,
  width: number
): Promise<{ buffer: Buffer; fromCache: boolean }> {
  const cachePath = getThumbnailCachePath(originalPath);

  // Return cached thumbnail if exists
  if (fs.existsSync(cachePath)) {
    return { buffer: fs.readFileSync(cachePath), fromCache: true };
  }

  // Generate new thumbnail
  ensureThumbnailDir();
  const buffer = await generateThumbnail(originalPath, width);
  fs.writeFileSync(cachePath, buffer);
  return { buffer, fromCache: false };
}

// ============ Cache cleanup ============

/**
 * Delete the cached thumbnail for a single file.
 * Safe to call even if no cache exists.
 */
export function clearThumbnailCache(originalPath: string): void {
  const cachePath = getThumbnailCachePath(originalPath);
  try {
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Recursively walk a directory and clear all thumbnail caches for files within.
 * Used when deleting a folder.
 */
export function clearThumbnailCacheRecursive(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        clearThumbnailCacheRecursive(fullPath);
      } else if (stat.isFile()) {
        clearThumbnailCache(fullPath);
      }
    } catch {
      // Skip inaccessible entries
    }
  }
}
