import { NextRequest, NextResponse } from "next/server";
import { resolveSpacePath } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
import fs from "fs";
import path from "path";

export async function PUT(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const body = await request.json();
  const name: string = body.name || "";
  const subpath: string = body.subpath || "";
  const targetSubpath: string = body.targetSubpath || "";
  const spaceType = body.spaceType || "personal";
  const spaceId = body.spaceId || String(user.userId);

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  if (!name) {
    return NextResponse.json({ success: false, error: "缺少文件名参数" }, { status: 400 });
  }

  let sourceDir: string;
  let targetDir: string;
  try {
    sourceDir = resolveSpacePath(spaceType, spaceId, subpath);
    targetDir = resolveSpacePath(spaceType, spaceId, targetSubpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  const sourcePath = path.join(sourceDir, name);
  const targetPath = path.join(targetDir, name);

  const realSource = path.resolve(sourcePath);
  const realTarget = path.resolve(targetPath);
  const realBase = path.resolve(resolveSpacePath(spaceType, spaceId));

  if (!realSource.startsWith(realBase) || !realTarget.startsWith(realBase)) {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  if (realTarget.startsWith(realSource + path.sep)) {
    return NextResponse.json({ success: false, error: "不能将文件夹移动到自身或子目录" }, { status: 400 });
  }

  if (!fs.existsSync(sourcePath)) {
    return NextResponse.json({ success: false, error: "源文件或文件夹不存在" }, { status: 404 });
  }

  if (fs.existsSync(targetPath)) {
    return NextResponse.json({ success: false, error: "目标位置已存在同名项" }, { status: 409 });
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.renameSync(sourcePath, targetPath);
  return NextResponse.json({
    success: true,
    data: { name, from: subpath, to: targetSubpath },
  });
}
