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
  const folderName = body.folderName;
  const subpath = body.subpath || "";
  const spaceType = body.spaceType || "personal";
  const spaceId = body.spaceId || String(user.userId);

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  if (!folderName || typeof folderName !== "string") {
    return NextResponse.json({ success: false, error: "缺少文件夹名称" }, { status: 400 });
  }

  const safeName = folderName.replace(/[<>:"/\\|?*]/g, "_").trim();
  if (!safeName) {
    return NextResponse.json({ success: false, error: "文件夹名称无效" }, { status: 400 });
  }

  let targetDir: string;
  try {
    targetDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  const newFolder = path.join(targetDir, safeName);
  const realPath = path.resolve(newFolder);
  const realBase = path.resolve(resolveSpacePath(spaceType, spaceId));

  if (!realPath.startsWith(realBase)) {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  if (fs.existsSync(newFolder)) {
    return NextResponse.json({ success: false, error: "文件夹已存在" }, { status: 409 });
  }

  fs.mkdirSync(newFolder, { recursive: true });
  return NextResponse.json({ success: true, data: { folderName: safeName } });
}
