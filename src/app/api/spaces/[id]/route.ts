/**
 * PUT    /api/spaces/[id] — rename space (owner only)
 * DELETE /api/spaces/[id] — delete space (owner only)
 */

import { NextRequest } from "next/server";
import { requireAuth, authError } from "@/lib/auth";
import { renameSpace, deleteSharedSpace } from "@/lib/spaces";
import { deleteSpaceDirectory } from "@/lib/file-utils-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { id } = await params;
  const { name } = await request.json().catch(() => ({ name: "" }));

  const result = renameSpace(id, name, user.userId);
  if ("error" in result) {
    return Response.json(
      { success: false, error: result.error },
      { status: result.error === "空间不存在" ? 404 : 403 }
    );
  }

  return Response.json({ success: true, data: result.space });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const { id } = await params;
  const result = deleteSharedSpace(id, user.userId);

  if (result !== true) {
    return Response.json(
      { success: false, error: result.error },
      { status: result.error === "空间不存在" ? 404 : 403 }
    );
  }

  // Clean up files
  deleteSpaceDirectory("shared", id);

  return Response.json({ success: true });
}
