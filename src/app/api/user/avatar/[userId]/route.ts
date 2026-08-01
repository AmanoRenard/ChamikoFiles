import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const AVATARS_DIR = path.resolve(process.cwd(), "data", "avatars");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // Security: only allow numeric user IDs
  if (!/^\d+$/.test(userId)) {
    return NextResponse.json(
      { success: false, error: "无效的用户 ID" },
      { status: 400 }
    );
  }

  const avatarPath = path.join(AVATARS_DIR, `${userId}.jpg`);

  if (!fs.existsSync(avatarPath)) {
    return NextResponse.json(
      { success: false, error: "头像不存在" },
      { status: 404 }
    );
  }

  const buffer = fs.readFileSync(avatarPath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600",
      "Content-Length": String(buffer.length),
    },
  });
}
