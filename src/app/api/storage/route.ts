import { NextRequest, NextResponse } from "next/server";
import { readConfig } from "@/lib/config";
import { getSpaceStorageSize } from "@/lib/file-utils-server";
import { requireAuth, authError } from "@/lib/auth";
import { listUserSpaces, checkSpaceAccess } from "@/lib/spaces";
import { StorageStats } from "@/types";

export async function GET(request: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return authError("未登录");

  const config = readConfig();
  const { searchParams } = new URL(request.url);
  const spaceType = searchParams.get("spaceType");
  const spaceId = searchParams.get("spaceId");

  // If specific space requested, return that space's stats
  if (spaceType && spaceId) {
    const accessCheck = checkSpaceAccess(spaceType, spaceId, user.userId);
    if (!accessCheck.allowed) {
      return authError(accessCheck.error, 403);
    }

    const { usedSpace, fileCount } = getSpaceStorageSize(spaceType, spaceId);
    const maxSpace =
      spaceType === "personal"
        ? config.quota.defaultPersonalQuota > 0
          ? config.quota.defaultPersonalQuota
          : config.storage.maxSpace
        : config.quota.defaultSharedQuota > 0
          ? config.quota.defaultSharedQuota
          : -1;

    const usagePercent = maxSpace > 0 ? Math.round((usedSpace / maxSpace) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: { usedSpace, maxSpace, fileCount, usagePercent: Math.min(usagePercent, 100) } as StorageStats,
    });
  }

  // Aggregate all spaces for the current user
  const spaces = listUserSpaces(user.userId);
  let totalUsed = 0;
  let totalFiles = 0;

  for (const space of spaces) {
    const { usedSpace, fileCount } = getSpaceStorageSize(space.type, space.id);
    totalUsed += usedSpace;
    totalFiles += fileCount;
  }

  // Use personal quota as basis for aggregate
  const maxSpace =
    config.quota.defaultPersonalQuota > 0
      ? config.quota.defaultPersonalQuota
      : config.storage.maxSpace;
  const usagePercent = maxSpace > 0 ? Math.round((totalUsed / maxSpace) * 100) : 0;

  return NextResponse.json({
    success: true,
    data: {
      usedSpace: totalUsed,
      maxSpace,
      fileCount: totalFiles,
      usagePercent: Math.min(usagePercent, 100),
    } as StorageStats,
  });
}
