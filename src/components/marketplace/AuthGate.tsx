"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/lib/bay/auth-types";

/**
 * BAY AuthGate — wraps any route that requires authentication.
 *
 * Uses NextAuth's useSession() for real session verification.
 * The session is populated from the JWT (no DB lookup per request).
 *
 * Behavior:
 *   1. While checking auth status → show a minimal loader
 *   2. If not authenticated → redirect to /auth/login with ?redirect=<currentPath>
 *   3. If authenticated but wrong role → show "insufficient access" screen
 *   4. If authenticated + correct role → render children
 *
 * Role hierarchy: admin > seller > customer
 */

const ROLE_LEVEL: Record<UserRole, number> = {
  customer: 1,
  seller: 2,
  admin: 3,
};

export default function AuthGate({
  children,
  requiredRole = "customer",
  reason,
}: {
  children: React.ReactNode;
  requiredRole?: UserRole;
  reason?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      const redirect = encodeURIComponent(pathname);
      router.replace(
        `/auth/login?redirect=${redirect}&reason=${encodeURIComponent(reason ?? "")}`
      );
    }
  }, [status, pathname, router, reason]);

  // Still loading — minimal loader
  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-[var(--hairline)] border-t-[var(--platinum)] animate-spin" />
          <div className="eyebrow">Verifying access</div>
        </div>
      </div>
    );
  }

  // Not authenticated — show a brief message before redirect kicks in
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-md"
        >
          <div className="eyebrow-platinum mb-4">Authentication Required</div>
          <h1 className="font-display text-4xl font-light mb-4">
            Please sign in to <span className="italic-serif text-[var(--platinum)]">continue</span>
          </h1>
          <p className="body-md mb-8">
            {reason ?? "You need an account to access this page."}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
              className="btn-bay btn-bay-solid"
            >
              <span>Sign In</span>
            </Link>
            <Link
              href={`/auth/register?redirect=${encodeURIComponent(pathname)}`}
              className="btn-bay"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const userRole = (session.user.role ?? "customer") as UserRole;

  // Authenticated but insufficient role
  if (ROLE_LEVEL[userRole] < ROLE_LEVEL[requiredRole]) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-md"
        >
          <div className="eyebrow mb-4">Access Restricted</div>
          <h1 className="font-display text-4xl font-light mb-4">
            Insufficient <span className="italic-serif text-[var(--platinum)]">access</span>
          </h1>
          <p className="body-md mb-2">
            This page requires <span className="text-[var(--platinum)] capitalize">{requiredRole}</span> access.
          </p>
          <p className="body-md mb-8">
            You are signed in as <span className="text-[var(--text)]">{session.user.name}</span> ({userRole}).
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/register" className="btn-bay btn-bay-solid">
              <span>Upgrade Account</span>
            </Link>
            <button onClick={() => router.back()} className="btn-bay">
              <span>Go Back</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // All clear — render the protected content
  return <>{children}</>;
}
