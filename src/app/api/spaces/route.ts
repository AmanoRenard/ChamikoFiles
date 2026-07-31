/**
 * GET  /api/spaces — list all spaces for current user
 * POST /api/spaces — create a new shared space
 */

import { NextRequest } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { listUserSpaces, createSharedSpace, canCreateSpace } from "@/lib/spaces";
import { ensureSpaceDirectory } from "@/lib/file-utils-server";
import { runMigrations } from "@/lib/migration";

export async function GET() {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  // Run migrations if needed (first access after upgrade)
  runMigrations();

  const spaces = listUserSpaces(user.userId);

  // Ensure personal space directory exists
  ensureSpaceDirectory("personal", String(user.userId));

  return Response.json({ success: true, data: spaces });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { name } = await request.json().catch(() => ({ name: "" }));

  if (!name || typeof name !== "string") {
    return Response.json({ success: false, error: "请提供空间名称" }, { status: 400 });
  }

  if (!canCreateSpace(user.userId)) {
    return Response.json(
      { success: false, error: "已达到共享空间创建上限" },
      { status: 403 }
    );
  }

  const result = createSharedSpace(name, user.userId);
  if ("error" in result) {
    return Response.json({ success: false, error: result.error }, { status: 400 });
  }

  // Ensure directory exists
  ensureSpaceDirectory("shared", result.space.id);

  return Response.json({ success: true, data: result.space });
}
