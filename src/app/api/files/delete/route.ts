import { NextRequest, NextResponse } from "next/server";
import { resolveSpacePath, recursiveDeleteFolder } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
import { clearThumbnailCache, clearThumbnailCacheRecursive } from "@/lib/thumbnail-utils";
import fs from "fs";
import path from "path";

export async function DELETE(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("name");
  const subpath = searchParams.get("subpath") || "";
  const spaceType = searchParams.get("spaceType") || "personal";
  const spaceId = searchParams.get("spaceId") || String(user.userId);

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  if (!filename) {
    return NextResponse.json({ success: false, error: "缺少文件名参数" }, { status: 400 });
  }

  let targetDir: string;
  try {
    targetDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  const filePath = path.join(targetDir, filename);
  const realPath = path.resolve(filePath);
  const spaceRoot = resolveSpacePath(spaceType, spaceId);
  if (!realPath.startsWith(path.resolve(spaceRoot))) {
    return NextResponse.json({ success: false, error: "非法的文件路径" }, { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ success: false, error: "文件或文件夹不存在" }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    clearThumbnailCacheRecursive(filePath);
    recursiveDeleteFolder(filePath);
  } else {
    clearThumbnailCache(filePath);
    fs.unlinkSync(filePath);
  }

  return NextResponse.json({ success: true, data: { deleted: filename } });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const body = await request.json();
  const items: string[] = body.items || [];
  const subpath: string = body.subpath || "";
  const spaceType = body.spaceType || "personal";
  const spaceId = body.spaceId || String(user.userId);

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  if (!items.length) {
    return NextResponse.json({ success: false, error: "没有指定要删除的项目" }, { status: 400 });
  }

  let targetDir: string;
  try {
    targetDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  const spaceRoot = resolveSpacePath(spaceType, spaceId);
  const realRoot = path.resolve(spaceRoot);
  const deleted: string[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const itemPath = path.join(targetDir, item);
    const realPath = path.resolve(itemPath);

    if (!realPath.startsWith(realRoot)) {
      errors.push(`${item}: 非法路径`);
      continue;
    }

    if (!fs.existsSync(itemPath)) {
      errors.push(`${item}: 不存在`);
      continue;
    }

    try {
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        clearThumbnailCacheRecursive(itemPath);
        recursiveDeleteFolder(itemPath);
      } else {
        clearThumbnailCache(itemPath);
        fs.unlinkSync(itemPath);
      }
      deleted.push(item);
    } catch {
      errors.push(`${item}: 删除失败`);
    }
  }

  return NextResponse.json({ success: true, data: { deleted, errors } });
}
