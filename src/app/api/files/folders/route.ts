import { NextRequest, NextResponse } from "next/server";
import { readConfig } from "@/lib/config";
import { safeResolvePath } from "@/lib/file-utils-server";
import fs from "fs";
import path from "path";

// GET: 列出所有文件夹（用于移动时选择目标）
export async function GET(request: NextRequest) {
  const config = readConfig();
  const { searchParams } = new URL(request.url);
  const parentPath = searchParams.get("path") || "";

  let currentDir: string;
  try {
    currentDir = safeResolvePath(config.storage.path, parentPath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  if (!fs.existsSync(currentDir)) {
    return NextResponse.json({ success: true, data: [] });
  }

  const folders: { name: string; path: string; hasChildren: boolean }[] = [];

  try {
    const entries = fs.readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const folderPath = parentPath ? `${parentPath}/${entry}` : entry;
          let hasChildren = false;
          try {
            const subEntries = fs.readdirSync(fullPath);
            hasChildren = subEntries.some((e) => {
              try {
                return fs.statSync(path.join(fullPath, e)).isDirectory();
              } catch {
                return false;
              }
            });
          } catch {
            // ignore
          }
          folders.push({ name: entry, path: folderPath, hasChildren });
        }
      } catch {
        // skip
      }
    }
  } catch {
    // skip
  }

  folders.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  return NextResponse.json({ success: true, data: folders });
}
