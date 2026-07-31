import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { RegisterRequest } from "@/types";

export async function POST(request: NextRequest) {
  const body: RegisterRequest = await request.json();
  const { username, password, invitationCode } = body;

  // Validate input
  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "用户名和密码不能为空" },
      { status: 400 }
    );
  }

  if (username.length < 2 || username.length > 32) {
    return NextResponse.json(
      { success: false, error: "用户名需要 2-32 个字符" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, error: "密码至少需要 6 个字符" },
      { status: 400 }
    );
  }

  // Check if username exists
  if (db.findUserByUsername(username)) {
    return NextResponse.json(
      { success: false, error: "用户名已存在" },
      { status: 409 }
    );
  }

  const isFirstUser = !db.hasAnyUser();

  // Non-first user must provide valid invitation code
  if (!isFirstUser) {
    if (!invitationCode) {
      return NextResponse.json(
        { success: false, error: "需要邀请码才能注册" },
        { status: 400 }
      );
    }

    // Validate invitation code (will be consumed after user creation)
    const activeInvite = db.getActiveInvite();
    if (
      !activeInvite ||
      activeInvite.code !== invitationCode.toUpperCase().trim()
    ) {
      return NextResponse.json(
        { success: false, error: "邀请码无效或已过期" },
        { status: 400 }
      );
    }
  }

  // Create user
  const passwordHash = await hashPassword(password);
  const isAdmin = isFirstUser;
  const user = db.createUser(username, passwordHash, isAdmin);

  // Consume invitation code if used
  if (!isFirstUser && invitationCode) {
    db.validateAndUseInvite(invitationCode.toUpperCase().trim(), user.id);
  }

  // Sign JWT and set cookie
  const token = await signToken({
    userId: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
  });
  await setAuthCookie(token);

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
  });
}
