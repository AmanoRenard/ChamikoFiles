import { NextRequest, NextResponse } from "next/server";
import { resolveSpacePath } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
import { getOrGenerateThumbnail } from "@/lib/thumbnail-utils";
import { isImageFile } from "@/lib/file-utils";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("name");
  const subpath = searchParams.get("subpath") || "";
  const spaceType = searchParams.get("spaceType") || "personal";
  const spaceId = searchParams.get("spaceId") || String(user.userId);
  const sizeParam = searchParams.get("size") || "card"; // "card" = 400px, "row" = 200px

  const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
  if (!accessCheck.allowed) {
    return authError(accessCheck.error, 403);
  }

  if (!filename) {
    return NextResponse.json({ success: false, error: "缺少文件名参数" }, { status: 400 });
  }

  // Validate it's an image file
  if (!isImageFile(filename)) {
    return NextResponse.json({ success: false, error: "仅支持图片缩略图" }, { status: 400 });
  }

  let targetDir: string;
  try {
    targetDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  const filePath = path.join(targetDir, filename);
  const realPath = path.resolve(filePath);
  const spaceRoot = path.resolve(resolveSpacePath(spaceType, spaceId));
  if (!realPath.startsWith(spaceRoot)) {
    return NextResponse.json({ success: false, error: "非法的文件路径" }, { status: 403 });
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return NextResponse.json({ success: false, error: "文件不存在" }, { status: 404 });
  }

  // Determine thumbnail width based on size param
  const width = sizeParam === "row" ? 200 : 400;

  try {
    const { buffer, fromCache } = await getOrGenerateThumbnail(filePath, width);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(buffer.length),
        // Cache aggressively: 1 year for thumbnails since they're derived from file content
        "Cache-Control": "public, max-age=31536000, immutable",
        // If freshly generated (not from cache), set a shorter cache for first request
        ...(fromCache
          ? {}
          : { "X-Thumbnail-Cache": "miss" }),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "缩略图生成失败" }, { status: 500 });
  }
}
