/**
 * GET    /api/spaces/[id]/members — list members
 * DELETE /api/spaces/[id]/members — remove member (owner only, query: ?userId=)
 */

import { NextRequest } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { getSpaceMembers, removeMember } from "@/lib/spaces";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { id } = await params;
  const result = getSpaceMembers(id, user.userId);

  if ("error" in result) {
    return Response.json(
      { success: false, error: result.error },
      { status: result.error === "空间不存在" ? 404 : 403 }
    );
  }

  return Response.json({ success: true, data: result });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const targetUserId = parseInt(searchParams.get("userId") || "", 10);

  if (!targetUserId || isNaN(targetUserId)) {
    return Response.json(
      { success: false, error: "请指定要移除的用户" },
      { status: 400 }
    );
  }

  const result = removeMember(id, targetUserId, user.userId);
  if (result !== true) {
    return Response.json(
      { success: false, error: result.error },
      { status: 403 }
    );
  }

  return Response.json({ success: true });
}
