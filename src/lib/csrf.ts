import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import crypto from "crypto";

/**
 * BAY CSRF Protection
 *
 * SECURITY FIX (C5): Double-submit cookie pattern for CSRF protection.
 *
 * How it works:
 * 1. On GET requests to protected pages, set a `csrf-token` cookie (httpOnly, secure, sameSite=lax)
 * 2. Client reads the cookie and sends it in a custom header `x-csrf-token` on mutations
 * 3. Server verifies the header matches the cookie value
 *
 * This protects all state-changing operations (POST, PATCH, PUT, DELETE).
 */

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Set CSRF token cookie on response
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get CSRF token from request cookies
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Get CSRF token from request header
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | undefined {
  return request.headers.get(CSRF_HEADER_NAME) ?? undefined;
}

/**
 * Verify CSRF token matches between cookie and header
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  const cookieToken = getCsrfTokenFromRequest(request);
  const headerToken = getCsrfTokenFromHeader(request);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken, "utf8"),
    Buffer.from(headerToken, "utf8")
  );
}

/**
 * Middleware helper: ensure CSRF token exists, create if missing
 * Call this in GET handlers for pages that will make mutations
 */
export async function ensureCsrfToken(request: NextRequest, response: NextResponse): Promise<string> {
  let token = getCsrfTokenFromRequest(request);

  if (!token) {
    token = generateCsrfToken();
    setCsrfCookie(response, token);
  }

  return token;
}

/**
 * Middleware helper: verify CSRF on mutation requests
 * Returns null if valid, NextResponse with 403 if invalid
 */
export async function verifyCsrfOrReject(request: NextRequest): Promise<NextResponse | null> {
  // Only check CSRF on mutating methods
  const mutatingMethods = ["POST", "PATCH", "PUT", "DELETE"];
  if (!mutatingMethods.includes(request.method)) {
    return null;
  }

  // Skip CSRF for webhook endpoints (verified via signature)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/webhooks/")) {
    return null;
  }

  // Skip CSRF for auth endpoints (NextAuth handles its own CSRF)
  if (pathname.startsWith("/api/auth/")) {
    return null;
  }

  // Skip CSRF for registration (public endpoint)
  if (pathname === "/api/auth/register") {
    return null;
  }

  if (!verifyCsrfToken(request)) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Wrapper for API route handlers to add CSRF protection
 * Usage:
 *   export async function POST(request: NextRequest) {
 *     const csrfError = await verifyCsrfOrReject(request);
 *     if (csrfError) return csrfError;
 *     // ... handler logic
 *   }
 */
export async function withCsrfProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const csrfError = await verifyCsrfOrReject(request);
  if (csrfError) return csrfError;
  return handler(request);
}