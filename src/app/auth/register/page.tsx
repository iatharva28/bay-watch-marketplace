"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn, useSession, signOut } from "next-auth/react";
import type { UserRole } from "@/lib/bay/auth-types";

/**
 * BAY /auth/register — customer + seller registration.
 * Creates a user via /api/auth/register, then signs them in.
 */

const ROLES: { id: UserRole; label: string; note: string }[] = [
  { id: "customer", label: "Customer", note: "Browse & buy" },
  { id: "seller", label: "Seller", note: "List & sell" },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const redirect = searchParams.get("redirect") || "/";
  const roleParam = searchParams.get("role");

  const [role, setRole] = useState<UserRole>(roleParam === "seller" ? "seller" : "customer");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    company: "",
    gstin: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the user via API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setSubmitting(false);
        return;
      }

      // 2. Sign them in via NextAuth
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created, but auto-login failed. Please sign in.");
        setSubmitting(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  // If already logged in, show a "sign out first" screen
  if (status === "authenticated" && session?.user) {
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
              You're signed in as a <span className="italic-serif text-[var(--platinum)]">{session.user.role}</span>
            </h1>
            <p className="body-md mb-8">
              To create a new account with a different role, please sign out first.
              Each email address can only be associated with one account type.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => signOut({ callbackUrl: "/auth/register" })}
                className="btn-bay btn-bay-solid"
              >
                <span>Sign Out to Register</span>
              </button>
              <Link
                href={session.user.role === "seller" || session.user.role === "admin" ? "/seller" : "/shop"}
                className="btn-bay"
              >
                <span>Back to {session.user.role === "seller" || session.user.role === "admin" ? "Dashboard" : "Shop"}</span>
              </Link>
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
          <div className="eyebrow-platinum mb-2">Join BAY</div>
          <h1 className="font-display text-3xl font-light mb-6">
            Create your <span className="italic-serif text-[var(--platinum)]">account</span>
          </h1>

          {error && (
            <p className="body-md mb-6 p-3 border border-[var(--steel)] text-[var(--ice)]">
              {error}
            </p>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-8">
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
            <Field label="Full Name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Field label="Phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />

            {role === "seller" && (
              <>
                <Field label="Company / Brand" value={form.company} onChange={(v) => setForm({ ...form, company: v })} required />
                <Field label="GSTIN" value={form.gstin} onChange={(v) => setForm({ ...form, gstin: v })} required />
              </>
            )}

            <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />

            <button
              type="submit"
              disabled={submitting}
              className="btn-bay btn-bay-solid w-full justify-center"
            >
              <span>{submitting ? "Creating account..." : role === "customer" ? "Create Account" : "Apply to Sell"}</span>
            </button>
          </form>

          {role === "seller" && (
            <p className="spec-mono mt-4 text-center">
              Seller applications are reviewed within 48 hours.
            </p>
          )}

          <div className="mt-8 pt-8 border-t border-[var(--hairline)] text-center">
            <p className="body-md">
              Already have an account?{" "}
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(redirect)}${role !== "customer" ? `&role=${role}` : ""}`}
                className="text-[var(--platinum)] hover:underline"
              >
                Sign in
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border border-[var(--hairline)] border-t-[var(--platinum)] animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="spec-mono block mb-2">
        {label}
        {required && <span className="text-[var(--platinum)] ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-transparent border border-[var(--hairline-strong)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--platinum)] transition-colors"
      />
    </div>
  );
}
