import { NextRequest, NextResponse } from "next/server";
import { resolveSpacePath, safeResolvePath } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
import fs from "fs";
import path from "path";

// GET: 列出指定空间内的所有文件夹（用于移动时选择目标）
export async function GET(request: NextRequest) {
  // 认证
  let user: { userId: number; username: string };
  try {
    user = await requireAuth();
  } catch {
    return authError("请先登录", 401);
  }

  const { searchParams } = new URL(request.url);
  const parentPath = searchParams.get("path") || "";
  const spaceType = searchParams.get("spaceType") || "personal";
  const spaceId = searchParams.get("spaceId") || String(user.userId);

  // 空间访问检查
  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return NextResponse.json({ success: false, error: accessCheck.error }, { status: 403 });
  }

  // 使用空间隔离路径解析
  const spaceRoot = resolveSpacePath(spaceType, spaceId, "");

  let currentDir: string;
  try {
    currentDir = safeResolvePath(spaceRoot, parentPath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  // 路径穿越防护：确保当前目录在空间根目录内
  if (!currentDir.startsWith(spaceRoot)) {
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
