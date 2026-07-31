import { NextRequest, NextResponse } from "next/server";
import { readConfig } from "@/lib/config";
import { getFileInfo, getFolderInfo, resolveSpacePath } from "@/lib/file-utils-server";
import { FileInfo, FileListParams } from "@/types";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const config = readConfig();
  const { searchParams } = new URL(request.url);

  const spaceType = searchParams.get("spaceType") || "personal";
  const spaceId = searchParams.get("spaceId") || String(user.userId);

  // Auth: verify space access
  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || config.display.sortBy;
  const sortOrder = searchParams.get("sortOrder") || config.display.sortOrder;
  const subpath = searchParams.get("subpath") || "";

  let currentDir: string;
  try {
    currentDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  if (!fs.existsSync(currentDir)) {
    fs.mkdirSync(currentDir, { recursive: true });
    return NextResponse.json({
      success: true,
      data: { files: [], total: 0, page: 1, pageSize: 50, totalPages: 0 },
    });
  }

  const allEntries = fs.readdirSync(currentDir);
  let fileInfos: FileInfo[] = [];

  for (const entry of allEntries) {
    const fullPath = path.join(currentDir, entry);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fileInfos.push(getFolderInfo(fullPath));
      } else if (stat.isFile()) {
        fileInfos.push(getFileInfo(fullPath));
      }
    } catch {
      // skip entries that can't be read
    }
  }

  if (search) {
    const lower = search.toLowerCase();
    fileInfos = fileInfos.filter((f) => f.name.toLowerCase().includes(lower));
  }

  const folders = fileInfos.filter((f) => f.isFolder);
  const files = fileInfos.filter((f) => !f.isFolder);

  const typeRank = (f: FileInfo) => {
    if (f.isImage) return 1;
    if (f.isVideo) return 2;
    if (f.isAudio) return 3;
    if (f.isText) return 4;
    return 5;
  };

  const sortFn = (a: FileInfo, b: FileInfo) => {
    let comparison = 0;
    if (sortBy === "type") {
      comparison = typeRank(a) - typeRank(b) || a.name.localeCompare(b.name, "zh-CN");
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name, "zh-CN");
    } else if (sortBy === "size") {
      comparison = a.size - b.size;
    } else if (sortBy === "date") {
      comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
    }
    return sortOrder === "desc" ? -comparison : comparison;
  };

  folders.sort(sortFn);
  files.sort(sortFn);

  const sorted = [...folders, ...files];
  const total = sorted.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const pagedFiles = sorted.slice(start, start + pageSize);

  return NextResponse.json({
    success: true,
    data: { files: pagedFiles, total, page, pageSize, totalPages },
  });
}
