import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authError } from "@/lib/auth";
import fs from "fs";
import path from "path";

interface MigrateResult {
  totalFiles: number;
  totalDirs: number;
  migratedFiles: number;
  migratedDirs: number;
  failedFiles: number;
  errors: string[];
}

interface WalkResult {
  dirs: string[];
  files: string[];
}

/**
 * Recursively walk a directory and return all dir and file paths (relative to root).
 */
function walkDir(rootDir: string): WalkResult {
  const result: WalkResult = { dirs: [], files: [] };
  if (!fs.existsSync(rootDir)) return result;

  function walk(dir: string) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const relPath = path.relative(rootDir, fullPath);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          result.dirs.push(relPath);
          walk(fullPath);
        } else if (stat.isFile()) {
          result.files.push(relPath);
        }
      } catch {
        // skip inaccessible entries
      }
    }
  }

  walk(rootDir);
  return result;
}

/**
 * POST /api/storage/migrate
 * Body: { oldPath: string, newPath: string, mode: "move" | "copy" }
 *
 * Moves or copies all files from oldPath to newPath.
 * oldPath/newPath are storage root directories containing
 * _user_directory/ and _shared_directory/ subdirectories.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }

  const body = await request.json();
  const { oldPath, newPath, mode } = body as {
    oldPath: string;
    newPath: string;
    mode: "move" | "copy";
  };

  if (!oldPath || !newPath || !["move", "copy"].includes(mode)) {
    return NextResponse.json(
      { success: false, error: "参数错误：需要 oldPath、newPath 和 mode（move 或 copy）" },
      { status: 400 }
    );
  }

  const resolvedOld = path.resolve(oldPath);
  const resolvedNew = path.resolve(newPath);

  // Safety checks
  if (resolvedOld === resolvedNew) {
    return NextResponse.json(
      { success: false, error: "新旧路径相同，无需迁移" },
      { status: 400 }
    );
  }

  // Prevent migrating into dangerous locations
  const dangerousPaths = ["/", "C:\\", "C:\\Windows", "C:\\Program Files", "C:\\Program Files (x86)"];
  if (dangerousPaths.includes(resolvedNew) || resolvedNew.length < 3) {
    return NextResponse.json(
      { success: false, error: "不允许迁移到系统关键目录" },
      { status: 400 }
    );
  }

  // Check old path exists
  if (!fs.existsSync(resolvedOld)) {
    return NextResponse.json(
      { success: false, error: "旧存储路径不存在，无需迁移" },
      { status: 400 }
    );
  }

  // Target directory must be empty or not exist
  if (fs.existsSync(resolvedNew)) {
    const entries = fs.readdirSync(resolvedNew);
    if (entries.length > 0) {
      return NextResponse.json(
        { success: false, error: "目标文件夹不为空，迁移前请确保目标文件夹为空" },
        { status: 400 }
      );
    }
  }

  // Ensure new path exists
  try {
    fs.mkdirSync(resolvedNew, { recursive: true });
  } catch {
    return NextResponse.json(
      { success: false, error: `无法创建新存储路径: ${resolvedNew}` },
      { status: 500 }
    );
  }

  // Verify new path is writable
  try {
    const testFile = path.join(resolvedNew, ".write_test");
    fs.writeFileSync(testFile, "test", "utf-8");
    fs.unlinkSync(testFile);
  } catch {
    return NextResponse.json(
      { success: false, error: `新存储路径不可写: ${resolvedNew}` },
      { status: 500 }
    );
  }

  // Walk old path and get all dirs and files
  const { dirs, files: allFiles } = walkDir(resolvedOld);
  const result: MigrateResult = {
    totalFiles: allFiles.length,
    totalDirs: dirs.length,
    migratedFiles: 0,
    migratedDirs: 0,
    failedFiles: 0,
    errors: [],
  };

  // Step 1: Create all directories first (including empty ones)
  for (const relPath of dirs) {
    const dest = path.join(resolvedNew, relPath);
    try {
      fs.mkdirSync(dest, { recursive: true });
      result.migratedDirs++;
    } catch (e) {
      result.errors.push(`[目录] ${relPath}: ${e instanceof Error ? e.message : "未知错误"}`);
    }
  }

  // Step 2: Migrate all files
  for (const relPath of allFiles) {
    const src = path.join(resolvedOld, relPath);
    const dest = path.join(resolvedNew, relPath);

    try {
      // Ensure destination directory exists
      const destDir = path.dirname(dest);
      fs.mkdirSync(destDir, { recursive: true });

      if (mode === "move") {
        // Use rename for efficient move
        fs.renameSync(src, dest);
      } else {
        // Copy mode
        fs.copyFileSync(src, dest);
      }
      result.migratedFiles++;
    } catch (e) {
      result.failedFiles++;
      result.errors.push(`${relPath}: ${e instanceof Error ? e.message : "未知错误"}`);
    }
  }

  // Clean up empty directories after move
  if (mode === "move") {
    try {
      removeEmptyDirs(resolvedOld);
    } catch {
      // non-critical
    }
  }

  return NextResponse.json({ success: true, data: result });
}

/**
 * Recursively remove empty directories.
 */
function removeEmptyDirs(dir: string): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        removeEmptyDirs(fullPath);
      }
    } catch {
      // skip
    }
  }
  // Try to remove the directory if empty
  try {
    const remaining = fs.readdirSync(dir);
    if (remaining.length === 0) {
      fs.rmdirSync(dir);
    }
  } catch {
    // not empty or no permission, skip
  }
}
