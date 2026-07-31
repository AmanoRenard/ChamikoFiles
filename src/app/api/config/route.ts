import { NextRequest, NextResponse } from "next/server";
import { readConfig, updateConfig } from "@/lib/config";
import { AppConfig } from "@/types";
import { requireAdmin, authError } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }
  const config = readConfig();
  return NextResponse.json({ success: true, data: config });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }

  try {
    const body = await request.json();
    const partial = {} as Record<string, Record<string, string | number>>;

    if (body.storage) {
      const s: Record<string, string | number> = {};
      if (typeof body.storage.path === "string" && body.storage.path.trim()) {
        s.path = body.storage.path.trim();
      }
      if (typeof body.storage.maxSpace === "number" && body.storage.maxSpace >= 0) {
        s.maxSpace = body.storage.maxSpace;
      }
      if (typeof body.storage.allowedTypes === "string") {
        s.allowedTypes = body.storage.allowedTypes;
      }
      if (Object.keys(s).length > 0) partial.storage = s;
    }

    if (body.display) {
      const d: Record<string, string | number> = {};
      if (body.display.viewMode === "grid" || body.display.viewMode === "list") {
        d.viewMode = body.display.viewMode;
      }
      if (body.display.sortBy === "name" || body.display.sortBy === "size" || body.display.sortBy === "date") {
        d.sortBy = body.display.sortBy;
      }
      if (body.display.sortOrder === "asc" || body.display.sortOrder === "desc") {
        d.sortOrder = body.display.sortOrder;
      }
      if (Object.keys(d).length > 0) partial.display = d;
    }

    if (body.quota) {
      const q: Record<string, string | number> = {};
      if (typeof body.quota.defaultPersonalQuota === "number") {
        q.defaultPersonalQuota = body.quota.defaultPersonalQuota;
      }
      if (typeof body.quota.defaultSharedQuota === "number") {
        q.defaultSharedQuota = body.quota.defaultSharedQuota;
      }
      if (typeof body.quota.maxSharedSpaces === "number") {
        q.maxSharedSpaces = body.quota.maxSharedSpaces;
      }
      if (Object.keys(q).length > 0) partial.quota = q;
    }

    const updated = updateConfig(partial as Partial<AppConfig>);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "请求数据格式错误" }, { status: 400 });
  }
}
