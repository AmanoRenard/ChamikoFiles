import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { LoginRequest } from "@/types";

export async function POST(request: NextRequest) {
  const body: LoginRequest = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "用户名和密码不能为空" },
      { status: 400 }
    );
  }

  const storedUser = db.findUserByUsername(username);
  if (!storedUser) {
    return NextResponse.json(
      { success: false, error: "用户名或密码错误" },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, storedUser.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { success: false, error: "用户名或密码错误" },
      { status: 401 }
    );
  }

  // Update last login
  db.updateLastLogin(storedUser.id);

  // Sign JWT and set cookie
  const token = await signToken({
    userId: storedUser.id,
    username: storedUser.username,
    isAdmin: storedUser.isAdmin,
  });
  await setAuthCookie(token);

  return NextResponse.json({
    success: true,
    data: {
      id: storedUser.id,
      username: storedUser.username,
      nickname: storedUser.nickname || storedUser.username,
      avatar: storedUser.avatar || null,
      isAdmin: storedUser.isAdmin,
      createdAt: storedUser.createdAt,
    },
  });
}
