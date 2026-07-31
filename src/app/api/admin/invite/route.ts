import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireAdmin,
  generateInviteCode,
  getInviteExpiry,
  getRemainingSeconds,
} from "@/lib/auth";
import { authError } from "@/lib/auth";

/** GET: get current active invitation code info */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }

  const active = db.getActiveInvite();
  if (!active) {
    return NextResponse.json({ success: true, data: null });
  }

  return NextResponse.json({
    success: true,
    data: {
      code: active.code,
      expiresAt: active.expiresAt,
      remainingSeconds: getRemainingSeconds(active.expiresAt),
      createdAt: active.createdAt,
    },
  });
}

/** POST: generate new invitation code (deactivates previous) */
export async function POST(_request: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }

  const code = generateInviteCode();
  const expiresAt = getInviteExpiry();
  const invite = db.createInvite(code, admin.userId, expiresAt);

  return NextResponse.json({
    success: true,
    data: {
      code: invite.code,
      expiresAt: invite.expiresAt,
      remainingSeconds: getRemainingSeconds(invite.expiresAt),
      createdAt: invite.createdAt,
    },
  });
}
