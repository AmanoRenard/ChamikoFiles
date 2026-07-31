/**
 * Space business logic — CRUD, invites, permission checks.
 * All functions assume the caller has already authenticated.
 */

import { spaceDb, db } from "@/lib/db";
import { readConfig } from "@/lib/config";
import { SharedSpace, SpaceSummary, SpaceMember } from "@/types";

// ============ Constants ============

const SPACE_INVITE_VALIDITY_HOURS = 24;

// ============ Space Management ============

export function listUserSpaces(userId: number): SpaceSummary[] {
  const config = readConfig();

  // Personal space is always available
  const personal: SpaceSummary = {
    id: String(userId),
    name: "个人空间",
    type: "personal",
    role: "personal",
    memberCount: 1,
    usedSpace: 0,
    maxSpace: config.quota.defaultPersonalQuota > 0 ? config.quota.defaultPersonalQuota : -1,
  };

  // Shared spaces the user belongs to
  const sharedSpaces = spaceDb.getSpacesForUser(userId);
  const shared: SpaceSummary[] = sharedSpaces.map((s) => {
    const role = spaceDb.getMemberRole(s.id, userId);
    return {
      id: s.id,
      name: s.name,
      type: "shared",
      role: role || "member",
      memberCount: s.memberCount,
      usedSpace: 0,
      maxSpace: config.quota.defaultSharedQuota > 0 ? config.quota.defaultSharedQuota : -1,
      ownerName: s.ownerId === userId ? undefined : undefined,
    };
  });

  return [personal, ...shared];
}

export function canCreateSpace(userId: number): boolean {
  const config = readConfig();
  const count = spaceDb.countOwnedSpaces(userId);
  return count < config.quota.maxSharedSpaces;
}

export function createSharedSpace(
  name: string,
  ownerId: number
): { space: SharedSpace } | { error: string } {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    return { error: "空间名称需在 1-50 个字符" };
  }

  if (trimmed === "个人空间") {
    return { error: "不能使用保留名称" };
  }

  const config = readConfig();
  const count = spaceDb.countOwnedSpaces(ownerId);
  if (count >= config.quota.maxSharedSpaces) {
    return { error: `每个人最多创建 ${config.quota.maxSharedSpaces} 个共享空间` };
  }

  const space = spaceDb.createSpace(trimmed, ownerId);
  return { space };
}

export function renameSpace(
  spaceId: string,
  newName: string,
  userId: number
): { space: SharedSpace } | { error: string } {
  const space = spaceDb.findSpaceById(spaceId);
  if (!space) return { error: "空间不存在" };
  if (space.ownerId !== userId) return { error: "只有创建者可以重命名空间" };

  const trimmed = newName.trim();
  if (!trimmed || trimmed.length > 50) {
    return { error: "空间名称需在 1-50 个字符" };
  }

  const updated = spaceDb.updateSpace(spaceId, { name: trimmed })!;
  return { space: updated };
}

export function deleteSharedSpace(
  spaceId: string,
  userId: number
): true | { error: string } {
  const space = spaceDb.findSpaceById(spaceId);
  if (!space) return { error: "空间不存在" };
  if (space.ownerId !== userId) return { error: "只有创建者可以删除空间" };

  spaceDb.deleteSpace(spaceId);
  return true;
}

// ============ Membership ============

export function getSpaceMembers(
  spaceId: string,
  userId: number
): SpaceMember[] | { error: string } {
  const space = spaceDb.findSpaceById(spaceId);
  if (!space) return { error: "空间不存在" };
  if (!spaceDb.isMember(spaceId, userId)) return { error: "无权查看" };

  return spaceDb.getSpaceMembers(spaceId);
}

export function removeMember(
  spaceId: string,
  targetUserId: number,
  actorId: number
): true | { error: string } {
  const space = spaceDb.findSpaceById(spaceId);
  if (!space) return { error: "空间不存在" };
  if (space.ownerId !== actorId) return { error: "只有创建者可以移除成员" };
  if (targetUserId === actorId) return { error: "不能移除自己" };

  const removed = spaceDb.removeMember(spaceId, targetUserId);
  if (!removed) return { error: "成员不存在" };
  return true;
}

// ============ Invites ============

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getInviteExpiry(): string {
  const date = new Date();
  date.setHours(date.getHours() + SPACE_INVITE_VALIDITY_HOURS);
  return date.toISOString();
}

export function getRemainingSeconds(expiresAt: string): number {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

export function createInvite(
  spaceId: string,
  userId: number
): {
  code: string;
  expiresAt: string;
  createdAt: string;
} | { error: string } {
  const space = spaceDb.findSpaceById(spaceId);
  if (!space) return { error: "空间不存在" };
  if (space.ownerId !== userId) return { error: "只有创建者可以生成邀请链接" };

  const code = generateInviteCode();
  const expiresAt = getInviteExpiry();
  const now = new Date().toISOString();

  spaceDb.createSpaceInvite(spaceId, code, userId, expiresAt, -1);
  return { code, expiresAt, createdAt: now };
}

export function getActiveInvite(
  spaceId: string,
  userId: number
): {
  code: string;
  expiresAt: string;
  createdAt: string;
  remainingSeconds: number;
  usedCount: number;
  maxUses: number;
  isRevoked: boolean;
} | { error: string } {
  const space = spaceDb.findSpaceById(spaceId);
  if (!space) return { error: "空间不存在" };
  if (!spaceDb.isMember(spaceId, userId)) return { error: "无权查看" };

  const invite = spaceDb.getActiveSpaceInvite(spaceId);
  if (!invite) return { error: "暂无有效邀请链接" };

  return {
    code: invite.code,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    remainingSeconds: getRemainingSeconds(invite.expiresAt),
    usedCount: invite.usedCount,
    maxUses: invite.maxUses,
    isRevoked: invite.isRevoked,
  };
}

export function revokeInvite(
  spaceId: string,
  userId: number
): true | { error: string } {
  const space = spaceDb.findSpaceById(spaceId);
  if (!space) return { error: "空间不存在" };
  if (space.ownerId !== userId) return { error: "只有创建者可以撤销邀请" };

  spaceDb.revokeSpaceInvite(spaceId);
  return true;
}

export function joinSpaceByCode(
  code: string,
  userId: number
): { space: SharedSpace } | { error: string } {
  const invite = spaceDb.findSpaceInviteByCode(code);
  if (!invite) return { error: "邀请码无效或已过期" };

  const space = spaceDb.findSpaceById(invite.spaceId);
  if (!space) return { error: "空间不存在" };

  if (spaceDb.isMember(invite.spaceId, userId)) {
    return { error: "你已经是该空间的成员" };
  }

  spaceDb.validateAndUseSpaceInvite(code, invite.spaceId);
  spaceDb.addMember(invite.spaceId, userId);
  return { space };
}

// ============ Permission Check ============

/** Verify that a user has access to a specific space. */
export function checkSpaceAccess(
  spaceType: string,
  spaceId: string,
  userId: number
): { allowed: true } | { allowed: false; error: string } {
  if (spaceType === "personal") {
    if (spaceId !== String(userId)) {
      return { allowed: false, error: "无权访问此个人空间" };
    }
    return { allowed: true };
  }

  if (spaceType === "shared") {
    if (!spaceDb.isMember(spaceId, userId)) {
      return { allowed: false, error: "你不在该共享空间中" };
    }
    return { allowed: true };
  }

  return { allowed: false, error: "无效的空间类型" };
}
