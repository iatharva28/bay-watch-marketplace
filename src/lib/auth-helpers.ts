import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/bay/auth-types";
import { authOptions, ROLE_LEVEL } from "@/lib/auth-config";

/**
 * Server-side auth helpers
 *
 * These wrap getServerSession() with role checks so every API
 * route can authorize in one line instead of repeating the
 * "if (!session) return 401" boilerplate.
 */

export async function getSession() {
  return getServerSession(authOptions);
}

/** Returns the session or a 401 response */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}

/** Returns the session if user has the required role, or a 403 */
export async function requireRole(role: UserRole) {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  const userRole = session!.user.role;
  const ROLE_LEVEL: Record<UserRole, number> = {
    customer: 1,
    seller: 2,
    admin: 3,
  };

  if (ROLE_LEVEL[userRole] < ROLE_LEVEL[role]) {
    return {
      session: null,
      error: NextResponse.json(
        {
          error: "Insufficient permissions",
          required: role,
          current: userRole,
        },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

/** Returns the session if user is a seller (or admin), or a 403 */
export async function requireSeller() {
  return requireRole("seller");
}

/** Returns the session if user is an admin, or a 403 */
export async function requireAdmin() {
  return requireRole("admin");
}
