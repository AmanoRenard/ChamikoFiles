/**
 * Next.js Middleware — global route protection.
 * Runs on Edge runtime, can only use Web APIs.
 * Minimal cookie check: if no token and route is protected → redirect /login.
 * Full JWT verification happens server-side in API routes / page data fetches.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "chamiko-token";

// Public routes — no auth needed
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/setup",
  "/api/auth",
  "/api/config/site",
  "/_next",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Public routes: always allow
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Protected routes: must have token cookie
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
