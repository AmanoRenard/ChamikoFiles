import { requireAdmin, authError } from "@/lib/auth";
import { spaceDb } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }

  const spaces = spaceDb.listSharedSpaces();
  return Response.json({ success: true, data: spaces });
}
