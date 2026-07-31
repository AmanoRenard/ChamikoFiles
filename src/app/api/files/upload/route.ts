import { NextRequest, NextResponse } from "next/server";
import { readConfig } from "@/lib/config";
import { resolveSpacePath, getSpaceStorageSize } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
import { spaceDb } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const config = readConfig();
  const { searchParams } = new URL(request.url);
  const spaceType = searchParams.get("spaceType") || "personal";
  const spaceId = searchParams.get("spaceId") || String(user.userId);

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  const subpath = searchParams.get("subpath") || "";

  let targetDir: string;
  try {
    targetDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const data = await request.formData();
  const files: File[] = [];
  const entries = data.entries();

  for (const entry of entries) {
    const value = entry[1];
    if (value instanceof File) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ success: false, error: "没有选择文件" }, { status: 400 });
  }

  const allowedTypes = config.storage.allowedTypes
    .split(",")
    .map((t: string) => t.trim().toLowerCase())
    .filter(Boolean);

  const uploaded: string[] = [];
  const errors: string[] = [];

  // Check space quota
  const { usedSpace: totalSize } = getSpaceStorageSize(spaceType, spaceId);
  const maxSpace =
    spaceType === "personal"
      ? ((): number => {
          const quota = spaceDb.getUserQuota(user.userId);
          if (quota && quota.personalSpaceMaxBytes > 0) return quota.personalSpaceMaxBytes;
          if (config.quota.defaultPersonalQuota > 0) return config.quota.defaultPersonalQuota;
          return config.storage.maxSpace;
        })()
      : config.quota.defaultSharedQuota > 0
        ? config.quota.defaultSharedQuota
        : -1;

  for (const file of files) {
    const fileExt = path.extname(file.name).toLowerCase();

    if (allowedTypes.length > 0 && !allowedTypes.includes(fileExt)) {
      errors.push(`${file.name}: 文件类型不允许`);
      continue;
    }

    if (maxSpace > 0 && totalSize + file.size > maxSpace) {
      errors.push(`${file.name}: 存储空间不足`);
      continue;
    }

    const targetPath = path.join(targetDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(targetPath, buffer);
    uploaded.push(file.name);
  }

  return NextResponse.json({
    success: true,
    data: { uploaded, errors },
  });
}
