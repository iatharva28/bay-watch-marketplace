import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * BAY Edge Proxy (Next.js 16 — renamed from middleware)
 *
 * Runs on every request at the edge (before the page renders).
 * Two jobs:
 *   1. Add security headers to every response
 *   2. Protect specific routes from unauthenticated access
 *
 * Auth: Reads the NextAuth JWT session token via getToken().
 * This verifies the JWT signature at the edge — can't be forged.
 *
 * Note: This is a SECONDARY auth layer. The primary gate is the
 * client-side AuthGate component + the server-side getServerSession()
 * in API routes. This proxy adds defense-in-depth by blocking
 * requests before they reach the page.
 */

// Routes that require authentication (customer minimum)
const CUSTOMER_ROUTES = ["/shop", "/product", "/cart", "/checkout", "/account"];

// Routes that require seller role
const SELLER_ROUTES = ["/seller"];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

// Security headers applied to every response
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // Content-Security-Policy — prevents XSS, clickjacking, data injection
  // Allows: self, inline styles (Tailwind), Razorpay checkout, Google Fonts
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://checkout-static.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "frame-src https://checkout.razorpay.com https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Apply security headers to every response
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Check if the route requires auth
  const isCustomerRoute = CUSTOMER_ROUTES.some((r) => pathname.startsWith(r));
  const isSellerRoute = SELLER_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  // Only verify the JWT if the route requires auth
  if (!isCustomerRoute && !isSellerRoute && !isAdminRoute) {
    return response;
  }

  // Read + verify the NextAuth JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If route requires auth and user isn't authenticated, redirect to login
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    if (isSellerRoute) {
      loginUrl.searchParams.set("reason", "Sign in as a seller to access the seller portal.");
    } else if (isAdminRoute) {
      loginUrl.searchParams.set("reason", "Admin access required.");
    } else {
      loginUrl.searchParams.set("reason", "Sign in to access this page.");
    }
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as "customer" | "seller" | "admin" | undefined;

  // Role-based checks
  if (isSellerRoute && userRole && userRole === "customer") {
    // Customer trying to access seller portal — redirect to upgrade
    const upgradeUrl = new URL("/auth/register", request.url);
    upgradeUrl.searchParams.set("redirect", pathname);
    upgradeUrl.searchParams.set("role", "seller");
    return NextResponse.redirect(upgradeUrl);
  }

  if (isAdminRoute && userRole !== "admin") {
    // Non-admin trying to access admin panel
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  // Run proxy on all paths except static assets and API routes
  // (API routes handle their own auth)
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)",
  ],
};
