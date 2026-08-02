import { NextRequest, NextResponse } from "next/server";
import { readConfig, updateConfig, writeConfig } from "@/lib/config";
import { AppConfig } from "@/types";
import { requireAdmin, authError } from "@/lib/auth";
import { getStorageBase } from "@/lib/file-utils-server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }
  const config = readConfig();
  // Also return the resolved old storage base for comparison
  const currentBase = getStorageBase();
  return NextResponse.json({ success: true, data: config, currentBase });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return authError("权限不足", 403);
  }

  const body = await request.json();
  const partial = {} as Record<string, Record<string, string | number>>;

  // Validate storage path: must be absolute or empty
  const rawStoragePath: string =
    typeof body.storage?.path === "string" ? body.storage.path.trim() : "";

  if (rawStoragePath && !path.isAbsolute(rawStoragePath)) {
    return NextResponse.json(
      { success: false, error: "存储路径必须是绝对路径，或者留空使用默认路径" },
      { status: 400 }
    );
  }

  if (body.storage) {
    const s: Record<string, string | number> = {};
    if (body.storage.path !== undefined && body.storage.path !== null) {
      s.path = rawStoragePath;
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

  if (body.site) {
    const si: Record<string, string | number> = {};
    if (typeof body.site.name === "string") si.name = body.site.name.trim();
    if (typeof body.site.description === "string") si.description = body.site.description.trim();
    if (Object.keys(si).length > 0) partial.site = si;
  }

  if (body.upload) {
    const u: Record<string, string | number> = {};
    if (typeof body.upload.maxFileSize === "number") u.maxFileSize = body.upload.maxFileSize;
    if (typeof body.upload.maxFilesPerBatch === "number") u.maxFilesPerBatch = body.upload.maxFilesPerBatch;
    if (Object.keys(u).length > 0) partial.upload = u;
  }

  if (body.security) {
    const sec: Record<string, string | number> = {};
    if (typeof body.security.maxLoginAttempts === "number") sec.maxLoginAttempts = body.security.maxLoginAttempts;
    if (typeof body.security.lockoutMinutes === "number") sec.lockoutMinutes = body.security.lockoutMinutes;
    if (typeof body.security.sessionTimeoutHours === "number") sec.sessionTimeoutHours = body.security.sessionTimeoutHours;
    if (Object.keys(sec).length > 0) partial.security = sec;
  }

  if (body.notification) {
    const n: Record<string, string | number> = {};
    if (typeof body.notification.storageAlertPercent === "number") n.storageAlertPercent = body.notification.storageAlertPercent;
    if (Object.keys(n).length > 0) partial.notification = n;
  }

  // Detect path change: compare new path with current resolved base
  const currentBase = getStorageBase();
  // If rawStoragePath is empty, resolved path is the default storage base
  const newResolved = rawStoragePath
    ? path.resolve(rawStoragePath)
    : getStorageBase();

  const pathChanged = newResolved !== currentBase;

  // If path changed, the new target directory must be empty (or not exist yet)
  // Only check on the first request (before migration); skip when migration is already done
  if (pathChanged && !body._migrationHandled) {
    if (fs.existsSync(newResolved)) {
      const entries = fs.readdirSync(newResolved);
      if (entries.length > 0) {
        return NextResponse.json(
          { success: false, error: "目标文件夹不为空，请选择一个空文件夹或新文件夹" },
          { status: 400 }
        );
      }
    }
  }

  // If path changed and the client didn't explicitly confirm migration is done,
  // return the path change info so the frontend can show the migration dialog
  if (pathChanged && !body._migrationHandled) {
    return NextResponse.json({
      success: true,
      pathChanged: true,
      oldPath: currentBase,
      newPath: newResolved,
      // Don't save yet - wait for migration confirmation
    });
  }

  // Either no path change, or migration has been handled - save config
  const updated = updateConfig(partial as Partial<AppConfig>);
  return NextResponse.json({ success: true, data: updated, pathChanged: false });
}
