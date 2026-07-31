import { NextRequest } from "next/server";
import { requireAdmin, authError } from "@/lib/auth";
import { spaceDb } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }

  const quotas = spaceDb.listAllQuotas();
  return Response.json({ success: true, data: quotas });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }

  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const personalSpaceMaxBytes = body.personalSpaceMaxBytes;

  if (!userId || typeof personalSpaceMaxBytes !== "number") {
    return Response.json(
      { success: false, error: "参数错误" },
      { status: 400 }
    );
  }

  const quota = spaceDb.setUserQuota(userId, personalSpaceMaxBytes);
  return Response.json({ success: true, data: quota });
}
