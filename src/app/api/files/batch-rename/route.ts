import { NextRequest, NextResponse } from "next/server";
import { resolveSpacePath } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const body = await request.json();
  const items: { oldName: string; newName: string }[] = body.items || [];
  const subpath: string = body.subpath || "";
  const spaceType = body.spaceType || "personal";
  const spaceId = body.spaceId || String(user.userId);

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  if (!items.length) {
    return NextResponse.json({ success: false, error: "没有指定要重命名的项目" }, { status: 400 });
  }

  let targetDir: string;
  try {
    targetDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  const renamed: { oldName: string; newName: string }[] = [];
  const errors: string[] = [];
  const realBase = path.resolve(resolveSpacePath(spaceType, spaceId));

  for (const item of items) {
    const sanitizedNew = item.newName.replace(/[<>:"/\\|?*]/g, "_").trim();
    if (!sanitizedNew) {
      errors.push(`${item.oldName}: 目标名称无效`);
      continue;
    }

    const oldPath = path.join(targetDir, item.oldName);
    const newPath = path.join(targetDir, sanitizedNew);
    const realOld = path.resolve(oldPath);
    const realNew = path.resolve(newPath);

    if (!realOld.startsWith(realBase) || !realNew.startsWith(realBase)) {
      errors.push(`${item.oldName}: 非法路径`);
      continue;
    }

    if (!fs.existsSync(oldPath)) {
      errors.push(`${item.oldName}: 不存在`);
      continue;
    }

    if (item.oldName === sanitizedNew) {
      renamed.push({ oldName: item.oldName, newName: sanitizedNew });
      continue;
    }

    if (fs.existsSync(newPath)) {
      errors.push(`${item.oldName}: 目标名称 ${sanitizedNew} 已存在`);
      continue;
    }

    try {
      fs.renameSync(oldPath, newPath);
      renamed.push({ oldName: item.oldName, newName: sanitizedNew });
    } catch {
      errors.push(`${item.oldName}: 重命名失败`);
    }
  }

  return NextResponse.json({ success: true, data: { renamed, errors } });
}
