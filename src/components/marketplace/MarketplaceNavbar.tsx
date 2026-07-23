"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/lib/bay/cart-store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/bay/ThemeToggle";

/**
 * BAY MarketplaceNavbar — the navigation bar for marketplace
 * pages (/shop, /product/[slug], /cart, /checkout, /seller, /admin).
 *
 * Distinct from the marketing Navbar:
 *   · Always visible (no hide-on-scroll)
 *   · Glass background always on
 *   · Cart icon with item count badge
 *   · Links to /shop, /seller, /account, plus "Back to Maison"
 *   · Mobile menu slide-down
 */
const LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Sell on BAY", href: "/seller" },
  { label: "Maison", href: "/" },
];

export default function MarketplaceNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const user = session?.user;

  // Hydration guard — avoid mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Track scroll for header glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "glass border-b border-[var(--hairline)]" : "border-b border-[var(--hairline)] bg-[var(--bg)]/80 backdrop-blur-md"
        )}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-display text-3xl font-light tracking-[0.4em] pl-[0.4em] text-[var(--text)] transition-colors group-hover:text-[var(--platinum)]">
              BAY
            </span>
            <span className="hidden sm:inline spec-mono border-l border-[var(--hairline)] pl-3">
              Marketplace
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs font-mono uppercase tracking-[0.2em] transition-colors duration-300",
                  pathname === link.href
                    ? "text-[var(--platinum)]"
                    : "text-[var(--text-soft)] hover:text-[var(--text)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right — theme toggle + auth + cart */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Auth state — either user menu or sign in/up */}
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href={user.role === "seller" || user.role === "admin" ? "/seller" : "/account"}
                  className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                >
                  <span className="w-6 h-6 rounded-full border border-[var(--hairline-strong)] flex items-center justify-center text-[10px]">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                  <span className="hidden lg:inline">{user.name?.split(" ")[0] ?? "User"}</span>
                  <span className="spec-mono text-[var(--platinum)] capitalize">{user.role}</span>
                </Link>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                  }}
                  className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--platinum)] transition-colors"
                  aria-label="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--text)] hover:text-[var(--platinum)] transition-colors border border-[var(--hairline-strong)] px-3 py-1.5"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative p-2 -mr-2 hover:text-[var(--platinum)] transition-colors"
              aria-label={mounted ? `Open cart, ${itemCount} items` : "Open cart"}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M5 7h12l-1 12H6L5 7z"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 7V5a3 3 0 016 0v2"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
              {/* Cart badge */}
                          {mounted && itemCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--platinum)] text-[var(--bg)] flex items-center justify-center font-mono text-[10px] font-medium">
                              {itemCount}
                            </span>
                          )}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 -mr-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <div className="w-6 h-px bg-[var(--text)] mb-1.5" />
              <div className="w-6 h-px bg-[var(--text)] mb-1.5" />
              <div className="w-4 h-px bg-[var(--text)] ml-auto" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[70] bg-[var(--bg)] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="aurora-wash" />
            <div className="relative h-full flex flex-col">
              <div className="h-20 px-6 flex items-center justify-between border-b border-[var(--hairline)]">
                <span className="font-display text-3xl font-light tracking-[0.4em] pl-[0.4em]">
                  BAY
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 -mr-2"
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 flex flex-col justify-center px-6 gap-2">
                {LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={link.href}
                      className="font-display text-5xl font-light py-2 border-b border-[var(--hairline)] block"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + LINKS.length * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {isAuthenticated && user ? (
                    <div className="py-4 border-b border-[var(--hairline)]">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-10 h-10 rounded-full border border-[var(--platinum)] flex items-center justify-center font-display text-lg">
                          {user.name?.charAt(0).toUpperCase() ?? "U"}
                        </span>
                        <div>
                          <div className="font-display text-2xl font-light">{user.name ?? "User"}</div>
                          <div className="spec-mono text-[var(--platinum)] capitalize">{user.role}</div>
                        </div>
                      </div>
                      <Link
                        href={user.role === "seller" || user.role === "admin" ? "/seller" : "/account"}
                        className="block font-display text-2xl font-light py-2"
                      >
                        My {user.role === "seller" || user.role === "admin" ? "Dashboard" : "Account"}
                      </Link>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="block font-display text-2xl font-light py-2 text-[var(--text-muted)]"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 py-2">
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileOpen(false)}
                        className="font-display text-3xl font-light py-2 border-b border-[var(--hairline)] block flex-1"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setMobileOpen(false)}
                        className="font-display text-3xl font-light py-2 border-b border-[var(--hairline)] block flex-1 text-[var(--platinum)]"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </motion.div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
