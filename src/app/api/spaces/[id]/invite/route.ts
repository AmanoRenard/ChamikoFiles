/**
 * POST   /api/spaces/[id]/invite — generate invite link (owner only)
 * GET    /api/spaces/[id]/invite — get active invite
 * DELETE /api/spaces/[id]/invite — revoke invite (owner only)
 */

import { NextRequest } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { createInvite, getActiveInvite, revokeInvite } from "@/lib/spaces";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { id } = await params;
  const result = createInvite(id, user.userId);

  if ("error" in result) {
    return Response.json(
      { success: false, error: result.error },
      { status: result.error === "空间不存在" ? 404 : 403 }
    );
  }

  return Response.json({ success: true, data: result });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { id } = await params;
  const result = getActiveInvite(id, user.userId);

  if ("error" in result) {
    if (result.error === "空间不存在") {
      return Response.json({ success: false, error: result.error }, { status: 404 });
    }
    return Response.json({ success: true, data: null });
  }

  return Response.json({ success: true, data: result });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { id } = await params;
  const result = revokeInvite(id, user.userId);

  if (result !== true) {
    return Response.json(
      { success: false, error: result.error },
      { status: result.error === "空间不存在" ? 404 : 403 }
    );
  }

  return Response.json({ success: true });
}
