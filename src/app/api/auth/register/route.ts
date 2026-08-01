import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { RegisterRequest } from "@/types";

/** 密码需至少8位，且至少包含字母、数字、特殊字符中的两种 */
function isPasswordValid(pwd: string): boolean {
  if (pwd.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\`~]/.test(pwd);
  const categories = [hasLetter, hasDigit, hasSpecial].filter(Boolean).length;
  return categories >= 2;
}

export async function POST(request: NextRequest) {
  const body: RegisterRequest = await request.json();
  const { username, nickname, password, invitationCode } = body;

  // Validate input
  if (!username || !password || !nickname) {
    return NextResponse.json(
      { success: false, error: "请填写所有必填字段" },
      { status: 400 }
    );
  }

  if (username.length < 2 || username.length > 32) {
    return NextResponse.json(
      { success: false, error: "用户名需要 2-32 个字符" },
      { status: 400 }
    );
  }

  if (nickname.trim().length < 1 || nickname.trim().length > 32) {
    return NextResponse.json(
      { success: false, error: "昵称需要 1-32 个字符" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { success: false, error: "密码至少需要 8 个字符" },
      { status: 400 }
    );
  }

  // Password must be at least 8 chars, with at least 2 of: letters, digits, special chars
  if (!isPasswordValid(password)) {
    return NextResponse.json(
      { success: false, error: "密码需至少8位，且至少包含字母、数字、特殊字符中的两种" },
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
  const user = db.createUser(username, passwordHash, isAdmin, nickname.trim());

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
      nickname: user.nickname || user.username,
      avatar: user.avatar || null,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
  });
}
