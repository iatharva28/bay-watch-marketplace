"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/bay/ScrollReveal";
import { cn } from "@/lib/utils";

/**
 * BAY /account — customer account dashboard.
 *
 * MVP scope:
 *   · Profile (name, email, phone)
 *   · Orders (mock order history)
 *   · Addresses (saved addresses)
 *   · Wishlist (empty state for now)
 *
 * Phase 2: real auth via NextAuth.js.
 */

const TABS = [
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "wishlist", label: "Wishlist" },
  { id: "profile", label: "Profile" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const MOCK_ORDERS = [
  { id: "BAY-LM2K-AB12", date: "June 28, 2025", product: "Meridian", amount: 4150000, status: "Delivered" },
  { id: "BAY-K9PQ-X7Y3", date: "May 14, 2025", product: "Aurora GMT", amount: 2780000, status: "Delivered" },
  { id: "BAY-J8RT-M4N6", date: "March 02, 2025", product: "Tide Diver", amount: 2480000, status: "Delivered" },
];

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const { data: session, status } = useSession();
  const user = session?.user;

  // Show loading state
  if (status === "loading") {
    return (
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border border-[var(--hairline)] border-t-[var(--platinum)] animate-spin" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    return null; // AuthGate will handle redirect
  }

  const displayName = user?.name || user?.email || "Guest";

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-6">
          <span className="section-num">/account</span>
          <span className="w-12 h-px bg-[var(--hairline)]" />
          <span className="eyebrow">Your Account</span>
        </div>
        <h1 className="display-2 text-[var(--text)] mb-3">
          Welcome back, <span className="italic-serif text-[var(--platinum)]">{displayName}</span>
        </h1>
        <p className="body-lg max-w-2xl mb-12">
          Manage your orders, addresses, and wishlist. As a BAY client,
          you have access to private viewings and priority allocations.
        </p>
      </ScrollReveal>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[var(--hairline)] mb-12 -mb-px overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "py-4 text-xs font-mono uppercase tracking-[0.18em] border-b-2 transition-colors whitespace-nowrap",
              tab === t.id
                ? "border-[var(--platinum)] text-[var(--text)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-soft)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display text-3xl font-light mb-6">Order History</h2>
          <ul className="space-y-4">
            {MOCK_ORDERS.map((order) => (
              <li key={order.id} className="surface p-6 flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-[var(--platinum)] mb-1">{order.id}</div>
                  <div className="font-display text-2xl font-light">{order.product}</div>
                  <div className="spec-mono mt-1">{order.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-[var(--text)] mb-1">
                    ₹{(order.amount / 100).toLocaleString("en-IN")}
                  </div>
                  <div className="spec-mono text-[var(--platinum)]">{order.status}</div>
                </div>
                <button className="btn-bay shrink-0">
                  <span>Details</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {tab === "addresses" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl font-light">Saved Addresses</h2>
            <button className="btn-bay btn-bay-solid">
              <span>Add Address</span>
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="surface-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="eyebrow-platinum">Home</div>
                <span className="spec-mono text-[var(--platinum)]">Default</span>
              </div>
              <div className="font-display text-lg font-light mb-1">{user?.name || "—"}</div>
              <div className="body-md">
                No address saved yet<br />
                <button className="btn-bay btn-bay-solid mt-4">
                  <span>Add Home Address</span>
                </button>
              </div>
            </div>
            <div className="surface p-6">
              <div className="eyebrow mb-4">Office</div>
              <div className="font-display text-lg font-light mb-1">{user?.name || "—"}</div>
              <div className="body-md">
                No office address saved<br />
                <button className="btn-bay mt-4">
                  <span>Add Office Address</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {tab === "wishlist" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full border border-[var(--hairline)] flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 24s-9-5.5-9-12a5 5 0 019-3 5 5 0 019 3c0 6.5-9 12-9 12z"
                stroke="var(--text-muted)"
                strokeWidth="1"
              />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-light mb-2">
            Your wishlist is empty
          </h2>
          <p className="body-md mb-6">
            Save pieces you're considering for later.
          </p>
          <Link href="/shop" className="btn-bay btn-bay-solid">
            <span>Explore the Collection</span>
          </Link>
        </motion.div>
      )}

      {tab === "profile" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xl"
              >
                <h2 className="font-display text-3xl font-light mb-6">Profile</h2>
                <div className="space-y-4">
                  <ProfileField label="Full Name" value={user?.name || "—"} />
                  <ProfileField label="Email" value={user?.email || "—"} />
                  <ProfileField label="Phone" value={user?.phone || "—"} />
                  <ProfileField label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"} />
                  <ProfileField label="Client Tier" value="Private Client" accent />
                </div>
                <button className="btn-bay mt-8">
                  <span>Edit Profile</span>
                </button>
              </motion.div>
            )}
    </div>
  );
}

function ProfileField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--hairline)]">
      <span className="spec-mono">{label}</span>
      <span className={cn(
        "font-display text-lg font-light",
        accent ? "text-[var(--platinum)]" : "text-[var(--text)]"
      )}>
        {value}
      </span>
    </div>
  );
}
