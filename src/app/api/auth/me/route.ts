import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未登录" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.userId,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar || null,
      isAdmin: user.isAdmin,
    },
  });
}
