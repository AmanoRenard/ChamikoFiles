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
  const oldName = body.oldName;
  const newName = body.newName;
  const subpath = body.subpath || "";
  const spaceType = body.spaceType || "personal";
  const spaceId = body.spaceId || String(user.userId);

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  if (!oldName || !newName || typeof oldName !== "string" || typeof newName !== "string") {
    return NextResponse.json({ success: false, error: "缺少重命名参数" }, { status: 400 });
  }

  const safeNewName = newName.replace(/[<>:"/\\|?*]/g, "_").trim();
  if (!safeNewName) {
    return NextResponse.json({ success: false, error: "新名称无效" }, { status: 400 });
  }

  if (oldName === safeNewName) {
    return NextResponse.json({ success: false, error: "新旧名称相同" }, { status: 400 });
  }

  let targetDir: string;
  try {
    targetDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  const oldPath = path.join(targetDir, oldName);
  const newPath = path.join(targetDir, safeNewName);

  const realOld = path.resolve(oldPath);
  const realNew = path.resolve(newPath);
  const realBase = path.resolve(resolveSpacePath(spaceType, spaceId));

  if (!realOld.startsWith(realBase) || !realNew.startsWith(realBase)) {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  if (!fs.existsSync(oldPath)) {
    return NextResponse.json({ success: false, error: "原文件或文件夹不存在" }, { status: 404 });
  }

  if (fs.existsSync(newPath)) {
    return NextResponse.json({ success: false, error: "目标名称已存在" }, { status: 409 });
  }

  fs.renameSync(oldPath, newPath);
  return NextResponse.json({ success: true, data: { oldName, newName: safeNewName } });
}
