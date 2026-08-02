import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getDataDir } from "@/lib/config";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const AVATARS_DIR = path.join(getDataDir(), "avatars");

function ensureAvatarsDir() {
  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
  }
}

// POST — upload avatar
export async function POST(request: NextRequest) {
  const authUser = await requireAuth();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求格式错误，需要 multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("avatar") as File | null;
  if (!file) {
    return NextResponse.json(
      { success: false, error: "未提供头像文件" },
      { status: 400 }
    );
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "仅支持 JPEG、PNG、WebP、GIF 格式" },
      { status: 400 }
    );
  }

  // Validate file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: "文件大小不能超过 5MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Process with sharp: resize to 256x256, convert to JPEG
  let processed: Buffer;
  try {
    processed = await sharp(buffer)
      .resize(256, 256, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { success: false, error: "图片处理失败，请检查文件是否有效" },
      { status: 400 }
    );
  }

  // Save avatar file
  ensureAvatarsDir();
  const avatarFileName = `${authUser.userId}.jpg`;
  const avatarPath = path.join(AVATARS_DIR, avatarFileName);
  fs.writeFileSync(avatarPath, processed);

  // Update user record
  const avatarUrl = `/api/user/avatar/${authUser.userId}`;
  const updated = db.updateUser(authUser.userId, { avatar: avatarUrl });
  if (!updated) {
    return NextResponse.json(
      { success: false, error: "用户不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      avatar: avatarUrl,
    },
  });
}
