import { NextRequest, NextResponse } from "next/server";
import { resolveSpacePath } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
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
  const forceDownload = searchParams.get("download") === "1";

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
  const spaceRoot = path.resolve(resolveSpacePath(spaceType, spaceId));
  if (!realPath.startsWith(spaceRoot)) {
    return NextResponse.json({ success: false, error: "非法的文件路径" }, { status: 403 });
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return NextResponse.json({ success: false, error: "文件不存在" }, { status: 404 });
  }

  const stats = fs.statSync(filePath);
  const ext = path.extname(filename).toLowerCase();

  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
    ".bmp": "image/bmp", ".avif": "image/avif", ".pdf": "application/pdf",
    ".json": "application/json", ".zip": "application/zip",
    ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".flac": "audio/flac",
    ".ogg": "audio/ogg", ".txt": "text/plain", ".md": "text/markdown",
    ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
    ".ts": "text/typescript", ".csv": "text/csv", ".xml": "text/xml",
  };

  const contentType = mimeMap[ext] || "application/octet-stream";
  const fileSize = stats.size;

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] !== "" ? parseInt(parts[1], 10) : fileSize - 1;

    if (end >= fileSize || start >= fileSize) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    const chunkBuffer = Buffer.alloc(chunkSize);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, chunkBuffer, 0, chunkSize, start);
    fs.closeSync(fd);

    return new NextResponse(chunkBuffer, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Cache-Control": "no-cache",
      },
    });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": forceDownload ? "application/octet-stream" : contentType,
      "Content-Disposition": forceDownload
        ? `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
        : `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
    },
  });
}
