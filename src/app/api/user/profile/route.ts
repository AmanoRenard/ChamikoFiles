import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const authUser = await requireAuth();

  let body: { nickname?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求格式错误" },
      { status: 400 }
    );
  }

  const { nickname } = body;

  if (nickname === undefined || typeof nickname !== "string") {
    return NextResponse.json(
      { success: false, error: "昵称不能为空" },
      { status: 400 }
    );
  }

  const trimmed = nickname.trim();
  if (trimmed.length === 0 || trimmed.length > 32) {
    return NextResponse.json(
      { success: false, error: "昵称需要 1-32 个字符" },
      { status: 400 }
    );
  }

  const updated = db.updateUser(authUser.userId, { nickname: trimmed });
  if (!updated) {
    return NextResponse.json(
      { success: false, error: "用户不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      username: updated.username,
      nickname: updated.nickname,
      avatar: updated.avatar,
      isAdmin: updated.isAdmin,
      createdAt: updated.createdAt,
    },
  });
}
