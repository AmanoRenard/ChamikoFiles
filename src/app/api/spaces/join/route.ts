/**
 * POST /api/spaces/join — join a space via invite code
 */

import { NextRequest } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { joinSpaceByCode } from "@/lib/spaces";
import { ensureSpaceDirectory } from "@/lib/file-utils-server";

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { code } = await request.json().catch(() => ({ code: "" }));

  if (!code || typeof code !== "string") {
    return Response.json(
      { success: false, error: "请提供邀请码" },
      { status: 400 }
    );
  }

  const result = joinSpaceByCode(code.toUpperCase(), user.userId);

  if ("error" in result) {
    return Response.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  // Ensure space directory exists
  ensureSpaceDirectory("shared", result.space.id);

  return Response.json({ success: true, data: result.space });
}
