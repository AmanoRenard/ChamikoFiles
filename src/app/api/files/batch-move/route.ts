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
  const items: string[] = body.items || [];
  const subpath: string = body.subpath || "";
  const targetSubpath: string = body.targetSubpath || "";
  const spaceType = body.spaceType || "personal";
  const spaceId = body.spaceId || String(user.userId);

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  if (!items.length) {
    return NextResponse.json({ success: false, error: "没有指定要移动的项目" }, { status: 400 });
  }

  let sourceDir: string;
  let targetDir: string;
  try {
    sourceDir = resolveSpacePath(spaceType, spaceId, subpath);
    targetDir = resolveSpacePath(spaceType, spaceId, targetSubpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const moved: string[] = [];
  const errors: string[] = [];
  const realBase = path.resolve(resolveSpacePath(spaceType, spaceId));

  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);
    const targetPath = path.join(targetDir, item);
    const realSource = path.resolve(sourcePath);
    const realTarget = path.resolve(targetPath);

    if (!realSource.startsWith(realBase) || !realTarget.startsWith(realBase)) {
      errors.push(`${item}: 非法路径`);
      continue;
    }

    if (!fs.existsSync(sourcePath)) {
      errors.push(`${item}: 不存在`);
      continue;
    }

    if (fs.existsSync(targetPath)) {
      errors.push(`${item}: 目标已存在同名项`);
      continue;
    }

    try {
      fs.renameSync(sourcePath, targetPath);
      moved.push(item);
    } catch {
      errors.push(`${item}: 移动失败`);
    }
  }

  return NextResponse.json({ success: true, data: { moved, errors } });
}
