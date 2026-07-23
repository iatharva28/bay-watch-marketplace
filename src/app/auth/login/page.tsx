"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn, useSession, signOut } from "next-auth/react";
import type { UserRole } from "@/lib/bay/auth-types";

/**
 * BAY /auth/login — customer + seller login via NextAuth.
 *
 * Reads ?redirect= from the URL and sends the user back after auth.
 * Reads ?reason= to show a contextual message.
 */

const ROLES: { id: UserRole; label: string; note: string }[] = [
  { id: "customer", label: "Customer", note: "Browse & buy" },
  { id: "seller", label: "Seller", note: "List & sell" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const redirect = searchParams.get("redirect") || "/";
  const reason = searchParams.get("reason");

  const initialRole: UserRole = redirect.startsWith("/admin")
    ? "admin"
    : redirect.startsWith("/seller")
      ? "seller"
      : "customer";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      role, // Send the selected role for server-side verification
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  // If already logged in, show a "switch account" screen instead of the form
  if (status === "authenticated" && session?.user) {
    const currentRole = session.user.role;
    const tryingToAccessDifferentRole =
      (initialRole === "seller" && currentRole === "customer") ||
      (initialRole === "customer" && currentRole === "seller");

    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-20">
        <div className="aurora-wash" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md text-center"
        >
          <div className="mb-10">
            <Link href="/" className="inline-block">
              <span className="font-display text-4xl font-light tracking-[0.4em] pl-[0.4em] text-[var(--text)]">
                BAY
              </span>
            </Link>
          </div>

          <div className="surface-elevated p-8">
            <div className="eyebrow-platinum mb-4">Already Signed In</div>
            <h1 className="font-display text-3xl font-light mb-4">
              You're signed in as a <span className="italic-serif text-[var(--platinum)]">{currentRole}</span>
            </h1>
            <p className="body-md mb-8">
              {tryingToAccessDifferentRole ? (
                <>
                  You're trying to access the <span className="text-[var(--platinum)]">{initialRole}</span> area,
                  but your account is registered as a <span className="text-[var(--text)]">{currentRole}</span>.
                  To use a different role, you need to create a new account with a different email address.
                </>
              ) : (
                <>You don't need to sign in again.</>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={currentRole === "seller" || currentRole === "admin" ? "/seller" : "/shop"}
                className="btn-bay btn-bay-solid"
              >
                <span>Go to {currentRole === "seller" || currentRole === "admin" ? "Dashboard" : "Shop"}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="btn-bay"
              >
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-20">
      <div className="aurora-wash" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <span className="font-display text-4xl font-light tracking-[0.4em] pl-[0.4em] text-[var(--text)]">
              BAY
            </span>
          </Link>
          <div className="eyebrow mt-3">Maison Horlogère</div>
        </div>

        <div className="surface-elevated p-8">
          <div className="eyebrow-platinum mb-2">Welcome Back</div>
          <h1 className="font-display text-3xl font-light mb-2">
            Sign in to your <span className="italic-serif text-[var(--platinum)]">account</span>
          </h1>

          {reason && (
            <p className="body-md mt-4 mb-6 text-[var(--platinum)]">
              {reason}
            </p>
          )}

          {error && (
            <p className="body-md mt-4 mb-6 p-3 border border-[var(--steel)] text-[var(--ice)]">
              {error}
            </p>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 my-6">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`p-4 border text-center transition-colors ${
                  role === r.id
                    ? "border-[var(--platinum)] bg-[var(--surface-1)]"
                    : "border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                }`}
              >
                <div className="font-display text-lg font-light">{r.label}</div>
                <div className="spec-mono mt-1">{r.note}</div>
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="spec-mono block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-transparent border border-[var(--hairline-strong)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--platinum)] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="spec-mono">Password</label>
                <button type="button" className="spec-mono hover:text-[var(--platinum)] transition-colors">
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-transparent border border-[var(--hairline-strong)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--platinum)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-bay btn-bay-solid w-full justify-center"
            >
              <span>{submitting ? "Signing in..." : `Sign in as ${role}`}</span>
            </button>
          </form>

          {/* Google OAuth */}
          <div className="mt-6 pt-6 border-t border-[var(--hairline)]">
            <button
              onClick={() => signIn("google", { callbackUrl: redirect })}
              className="btn-bay w-full justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14.5 8.2c0-.5 0-1-.1-1.5H8v3h3.7c-.2.9-.7 1.6-1.5 2.1v1.7h2.4c1.4-1.3 2.2-3.2 2.2-5.3z" fill="#4285F4"/>
                <path d="M8 15c2 0 3.7-.7 4.9-1.8l-2.4-1.7c-.7.4-1.5.7-2.5.7-1.9 0-3.5-1.3-4.1-3H1.4v1.8C2.6 13.6 5.1 15 8 15z" fill="#34A853"/>
                <path d="M3.9 9.2c-.2-.4-.3-.9-.3-1.4s.1-1 .3-1.4V4.6H1.4C.5 5.8 0 7.3 0 9s.5 3.2 1.4 4.4l2.5-1.8V9.2z" fill="#FBBC04"/>
                <path d="M8 3.2c1.1 0 2.1.4 2.8 1.1l2.1-2.1C11.7 1.1 10 0 8 0 5.1 0 2.6 1.4 1.4 3.6L3.9 5.4C4.5 4 6.1 3.2 8 3.2z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--hairline)] text-center">
            <p className="body-md">
              New to BAY?{" "}
              <Link
                href={`/auth/register?redirect=${encodeURIComponent(redirect)}${role !== "customer" ? `&role=${role}` : ""}`}
                className="text-[var(--platinum)] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="spec-mono hover:text-[var(--platinum)] transition-colors">
            ← Back to Maison
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border border-[var(--hairline)] border-t-[var(--platinum)] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
