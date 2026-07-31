/**
 * Authentication & authorization utilities.
 * - bcryptjs for password hashing
 * - jose for JWT signing/verification (Edge-compatible)
 * - Cookie-based httpOnly token storage
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// ============ Constants ============

const BCRYPT_ROUNDS = 12;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "chamiko-files-secret-key-change-in-production"
);
const TOKEN_EXPIRY = "7d"; // JWT expires in 7 days
const COOKIE_NAME = "chamiko-token";
const INVITE_VALIDITY_HOURS = 24;

// ============ Password ============

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============ JWT ============

export interface TokenPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch {
    return null;
  }
}

// ============ Cookie helpers ============

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

// ============ Current user ============

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getTokenFromCookie();
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<TokenPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<TokenPayload> {
  const user = await requireAuth();
  if (!user.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ============ Invitation code generation ============

/** Generate a random 8-character alphanumeric invitation code */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** Get expiry ISO string for invitation code */
export function getInviteExpiry(): string {
  const date = new Date();
  date.setHours(date.getHours() + INVITE_VALIDITY_HOURS);
  return date.toISOString();
}

/** Get remaining seconds for an invitation code */
export function getRemainingSeconds(expiresAt: string): number {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

// ============ Auth response helpers ============

export function authError(message: string, status: number = 401) {
  return Response.json({ success: false, error: message }, { status });
}
