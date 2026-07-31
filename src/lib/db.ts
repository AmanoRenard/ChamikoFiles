/**
 * JSON-file-based database for ChamikoFiles user system.
 * Designed for small-scale private cloud use — no external DB server needed.
 */

import fs from "fs";
import path from "path";
import { User, InvitationCode, SharedSpace, SpaceMember, SpaceInvite, UserQuota } from "@/types";

const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const INVITES_FILE = path.join(DATA_DIR, "invitations.json");
const SPACES_FILE = path.join(DATA_DIR, "spaces.json");
const SPACE_MEMBERS_FILE = path.join(DATA_DIR, "space_members.json");
const SPACE_INVITES_FILE = path.join(DATA_DIR, "space_invites.json");
const QUOTAS_FILE = path.join(DATA_DIR, "quotas.json");

// ============ low-level read/write ============

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function writeJSON<T>(filePath: string, data: T) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ============ User data (never exposed to client) ============

export interface StoredUser extends User {
  passwordHash: string;
}

function loadUsers(): StoredUser[] {
  return readJSON<StoredUser[]>(USERS_FILE, []);
}

function saveUsers(users: StoredUser[]) {
  writeJSON(USERS_FILE, users);
}

// ============ Invitation data ============

function loadInvitations(): InvitationCode[] {
  return readJSON<InvitationCode[]>(INVITES_FILE, []);
}

function saveInvitations(invs: InvitationCode[]) {
  writeJSON(INVITES_FILE, invs);
}

// ============ Public API ============

export const db = {
  // --- Users ---

  hasAnyUser(): boolean {
    const users = loadUsers();
    return users.length > 0;
  },

  findUserByUsername(username: string): StoredUser | undefined {
    const users = loadUsers();
    return users.find((u) => u.username === username);
  },

  findUserById(id: number): StoredUser | undefined {
    const users = loadUsers();
    return users.find((u) => u.id === id);
  },

  createUser(
    username: string,
    passwordHash: string,
    isAdmin: boolean
  ): User {
    const users = loadUsers();
    const id = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newUser: StoredUser = {
      id,
      username,
      passwordHash,
      isAdmin,
      createdAt: now,
      lastLogin: null,
    };

    users.push(newUser);
    saveUsers(users);

    const { passwordHash: _, ...safe } = newUser;
    return safe;
  },

  updateLastLogin(userId: number) {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].lastLogin = new Date().toISOString();
      saveUsers(users);
    }
  },

  listUsers(): User[] {
    const users = loadUsers();
    return users.map(({ passwordHash: _, ...rest }) => rest);
  },

  // --- Invitations ---

  /** Deactivate all unused codes and return them */
  deactivateActiveCodes(): InvitationCode[] {
    const invs = loadUsersInvitations();
    const updated = invs.map((inv) =>
      inv.isUsed ? inv : { ...inv, isUsed: true }
    );
    saveInvitations(updated);
    return invs.filter((inv) => !inv.isUsed);
  },

  createInvite(
    code: string,
    createdBy: number,
    expiresAt: string
  ): InvitationCode {
    // First deactivate all other active codes
    const invs = loadUsersInvitations();
    const updated = invs.map((inv) =>
      !inv.isUsed ? { ...inv, isUsed: true } : inv
    );

    const id =
      invs.length > 0 ? Math.max(...invs.map((i) => i.id)) + 1 : 1;
    const newInv: InvitationCode = {
      id,
      code,
      createdBy,
      createdAt: new Date().toISOString(),
      expiresAt,
      isUsed: false,
      usedBy: null,
      usedAt: null,
    };

    updated.push(newInv);
    saveInvitations(updated);
    return newInv;
  },

  getActiveInvite(): InvitationCode | null {
    const invs = loadUsersInvitations();
    const now = new Date().toISOString();
    const active = invs.find(
      (inv) => !inv.isUsed && inv.expiresAt > now
    );
    return active || null;
  },

  validateAndUseInvite(code: string, userId: number): boolean {
    const invs = loadUsersInvitations();
    const now = new Date().toISOString();
    const idx = invs.findIndex(
      (inv) => inv.code === code && !inv.isUsed && inv.expiresAt > now
    );

    if (idx === -1) return false;

    invs[idx].isUsed = true;
    invs[idx].usedBy = userId;
    invs[idx].usedAt = now;
    saveInvitations(invs);
    return true;
  },
};

/** Helper: load from file, clean expired codes */
function loadUsersInvitations(): InvitationCode[] {
  return loadInvitations();
}

// ============ Space data helpers ============

function loadSpaces(): SharedSpace[] {
  return readJSON<SharedSpace[]>(SPACES_FILE, []);
}

function saveSpaces(spaces: SharedSpace[]) {
  writeJSON(SPACES_FILE, spaces);
}

function loadSpaceMembers(): SpaceMember[] {
  return readJSON<SpaceMember[]>(SPACE_MEMBERS_FILE, []);
}

function saveSpaceMembers(members: SpaceMember[]) {
  writeJSON(SPACE_MEMBERS_FILE, members);
}

function loadSpaceInvites(): SpaceInvite[] {
  return readJSON<SpaceInvite[]>(SPACE_INVITES_FILE, []);
}

function saveSpaceInvites(invs: SpaceInvite[]) {
  writeJSON(SPACE_INVITES_FILE, invs);
}

function loadQuotas(): UserQuota[] {
  return readJSON<UserQuota[]>(QUOTAS_FILE, []);
}

function saveQuotas(quotas: UserQuota[]) {
  writeJSON(QUOTAS_FILE, quotas);
}

// ============ Space public API ============

export const spaceDb = {
  // --- Spaces ---

  listSharedSpaces(): SharedSpace[] {
    return loadSpaces();
  },

  findSpaceById(id: string): SharedSpace | undefined {
    const spaces = loadSpaces();
    return spaces.find((s) => s.id === id);
  },

  createSpace(name: string, ownerId: number): SharedSpace {
    const spaces = loadSpaces();
    const id =
      spaces.length > 0
        ? String(Date.now()) + "-" + Math.random().toString(36).substring(2, 8)
        : String(Date.now()) + "-" + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();
    const space: SharedSpace = {
      id,
      name,
      ownerId,
      createdAt: now,
      updatedAt: now,
      memberCount: 1,
    };
    spaces.push(space);
    saveSpaces(spaces);

    // Add owner as member
    const members = loadSpaceMembers();
    members.push({
      spaceId: id,
      userId: ownerId,
      username: "",
      role: "owner",
      joinedAt: now,
    });
    saveSpaceMembers(members);

    return space;
  },

  updateSpace(id: string, updates: Partial<Pick<SharedSpace, "name" | "memberCount">>): SharedSpace | undefined {
    const spaces = loadSpaces();
    const idx = spaces.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    spaces[idx] = {
      ...spaces[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveSpaces(spaces);
    return spaces[idx];
  },

  deleteSpace(id: string): boolean {
    const spaces = loadSpaces();
    const filtered = spaces.filter((s) => s.id !== id);
    if (filtered.length === spaces.length) return false;
    saveSpaces(filtered);

    // Clean up members
    const members = loadSpaceMembers().filter((m) => m.spaceId !== id);
    saveSpaceMembers(members);

    // Clean up invites
    const invites = loadSpaceInvites().filter((i) => i.spaceId !== id);
    saveSpaceInvites(invites);

    return true;
  },

  countOwnedSpaces(userId: number): number {
    const spaces = loadSpaces();
    return spaces.filter((s) => s.ownerId === userId).length;
  },

  getSpacesForUser(userId: number): SharedSpace[] {
    const members = loadSpaceMembers();
    const userMemberOf = members
      .filter((m) => m.userId === userId)
      .map((m) => m.spaceId);

    const spaces = loadSpaces();
    return spaces.filter((s) => userMemberOf.includes(s.id));
  },

  // --- Members ---

  getSpaceMembers(spaceId: string): SpaceMember[] {
    const userMap = new Map<number, string>();
    const users = loadUsers();
    users.forEach((u) => userMap.set(u.id, u.username));

    const members = loadSpaceMembers();
    return members
      .filter((m) => m.spaceId === spaceId)
      .map((m) => ({ ...m, username: userMap.get(m.userId) || String(m.userId) }));
  },

  addMember(spaceId: string, userId: number): SpaceMember | null {
    const members = loadSpaceMembers();
    if (members.some((m) => m.spaceId === spaceId && m.userId === userId)) {
      return null; // Already a member
    }
    const member: SpaceMember = {
      spaceId,
      userId,
      username: "",
      role: "member",
      joinedAt: new Date().toISOString(),
    };
    members.push(member);
    saveSpaceMembers(members);

    // Update member count
    this.updateSpace(spaceId, {
      memberCount: members.filter((m) => m.spaceId === spaceId).length,
    });

    return member;
  },

  removeMember(spaceId: string, userId: number): boolean {
    const members = loadSpaceMembers();
    const filtered = members.filter(
      (m) => !(m.spaceId === spaceId && m.userId === userId)
    );
    if (filtered.length === members.length) return false;
    saveSpaceMembers(filtered);

    this.updateSpace(spaceId, {
      memberCount: filtered.filter((m) => m.spaceId === spaceId).length,
    });

    return true;
  },

  isMember(spaceId: string, userId: number): boolean {
    const members = loadSpaceMembers();
    return members.some((m) => m.spaceId === spaceId && m.userId === userId);
  },

  getMemberRole(spaceId: string, userId: number): "owner" | "member" | null {
    const members = loadSpaceMembers();
    const member = members.find(
      (m) => m.spaceId === spaceId && m.userId === userId
    );
    return member ? member.role : null;
  },

  // --- Space Invites ---

  createSpaceInvite(
    spaceId: string,
    code: string,
    createdBy: number,
    expiresAt: string,
    maxUses: number
  ): SpaceInvite {
    const invites = loadSpaceInvites();
    // Revoke all existing active invites for this space
    const updated = invites.map((inv) =>
      inv.spaceId === spaceId && !inv.isRevoked
        ? { ...inv, isRevoked: true }
        : inv
    );

    const id = String(Date.now()) + "-" + Math.random().toString(36).substring(2, 8);
    const newInv: SpaceInvite = {
      id,
      spaceId,
      code,
      createdBy,
      createdAt: new Date().toISOString(),
      expiresAt,
      isRevoked: false,
      maxUses,
      usedCount: 0,
    };
    updated.push(newInv);
    saveSpaceInvites(updated);
    return newInv;
  },

  getActiveSpaceInvite(spaceId: string): SpaceInvite | null {
    const invites = loadSpaceInvites();
    const now = new Date().toISOString();
    return (
      invites.find(
        (inv) =>
          inv.spaceId === spaceId &&
          !inv.isRevoked &&
          inv.expiresAt > now &&
          (inv.maxUses === -1 || inv.usedCount < inv.maxUses)
      ) || null
    );
  },

  validateAndUseSpaceInvite(code: string, spaceId: string): boolean {
    const invites = loadSpaceInvites();
    const now = new Date().toISOString();
    const idx = invites.findIndex(
      (inv) =>
        inv.spaceId === spaceId &&
        inv.code === code &&
        !inv.isRevoked &&
        inv.expiresAt > now &&
        (inv.maxUses === -1 || inv.usedCount < inv.maxUses)
    );
    if (idx === -1) return false;

    invites[idx].usedCount++;
    // If max uses reached, revoke
    if (invites[idx].maxUses !== -1 && invites[idx].usedCount >= invites[idx].maxUses) {
      invites[idx].isRevoked = true;
    }
    saveSpaceInvites(invites);
    return true;
  },

  revokeSpaceInvite(spaceId: string): boolean {
    const invites = loadSpaceInvites();
    let revoked = false;
    const updated = invites.map((inv) => {
      if (inv.spaceId === spaceId && !inv.isRevoked) {
        revoked = true;
        return { ...inv, isRevoked: true };
      }
      return inv;
    });
    saveSpaceInvites(updated);
    return revoked;
  },

  findSpaceInviteByCode(code: string): SpaceInvite | null {
    const invites = loadSpaceInvites();
    const now = new Date().toISOString();
    return (
      invites.find(
        (inv) =>
          inv.code === code &&
          !inv.isRevoked &&
          inv.expiresAt > now &&
          (inv.maxUses === -1 || inv.usedCount < inv.maxUses)
      ) || null
    );
  },

  // --- Quotas ---

  getUserQuota(userId: number): UserQuota | undefined {
    const quotas = loadQuotas();
    return quotas.find((q) => q.userId === userId);
  },

  setUserQuota(userId: number, personalSpaceMaxBytes: number): UserQuota {
    const quotas = loadQuotas();
    const idx = quotas.findIndex((q) => q.userId === userId);
    const users = loadUsers();
    const user = users.find((u) => u.id === userId);
    const quota: UserQuota = {
      userId,
      username: user ? user.username : String(userId),
      personalSpaceMaxBytes,
    };

    if (idx !== -1) {
      quotas[idx] = quota;
    } else {
      quotas.push(quota);
    }
    saveQuotas(quotas);
    return quota;
  },

  listAllQuotas(): UserQuota[] {
    return loadQuotas();
  },

  deleteUserQuota(userId: number): boolean {
    const quotas = loadQuotas();
    const filtered = quotas.filter((q) => q.userId !== userId);
    if (filtered.length === quotas.length) return false;
    saveQuotas(filtered);
    return true;
  },
};
