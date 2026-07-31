import { NextRequest, NextResponse } from "next/server";
import { resolveSpacePath } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { checkSpaceAccess } from "@/lib/spaces";
import { ZipArchive } from "archiver";
import fs from "fs";
import path from "path";

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
    return NextResponse.json({ success: false, error: "没有指定要下载的项目" }, { status: 400 });
  }

  let targetDir: string;
  try {
    targetDir = resolveSpacePath(spaceType, spaceId, subpath);
  } catch {
    return NextResponse.json({ success: false, error: "非法路径" }, { status: 403 });
  }

  const realBase = path.resolve(resolveSpacePath(spaceType, spaceId));
  const archive = new ZipArchive({ zlib: { level: 6 } });

  for (const item of items) {
    const itemPath = path.join(targetDir, item);
    const realPath = path.resolve(itemPath);

    if (!realPath.startsWith(realBase)) continue;
    if (!fs.existsSync(itemPath)) continue;

    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      const walkDir = (dir: string, baseName: string) => {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const full = path.join(dir, entry);
          const rel = path.join(baseName, entry);
          try {
            if (fs.statSync(full).isDirectory()) {
              walkDir(full, rel);
            } else {
              archive.file(full, { name: rel });
            }
          } catch {
            // skip
          }
        }
      };
      walkDir(itemPath, item);
    } else {
      archive.file(itemPath, { name: item });
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      archive.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      archive.on("error", (err: Error) => {
        controller.error(err);
      });
      archive.finalize().then(() => {
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="batch-download-${Date.now()}.zip"`,
    },
  });
}
