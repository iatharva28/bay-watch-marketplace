"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS } from "@/lib/bay/data";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/bay/ThemeToggle";

/**
 * BAY Navbar — a translucent, glass-like bar that hides on
 * scroll-down and reveals on scroll-up. Contains the BAY
 * wordmark, primary nav (anchor links to sections), and a
 * "Private Client" CTA. Mobile opens a full-screen menu
 * with a staggered link reveal.
 */
export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const user = session?.user;

  useEffect(() => {
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > lastY);
      setScrolled(y > 40);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          hidden ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div
          className={cn(
            "transition-all duration-500",
            scrolled ? "glass border-b border-[var(--hairline)]" : ""
          )}
        >
          <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
            {/* Wordmark */}
            <a
              href="#top"
              className="flex items-center gap-3 group"
              aria-label="BAY home"
            >
              <span
                className="font-display text-3xl font-light tracking-[0.4em] pl-[0.4em] text-[var(--text)] transition-colors group-hover:text-[var(--platinum)]"
              >
                BAY
              </span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => {
                const isInternal = link.href.startsWith("/") && !link.href.startsWith("/#");
                return isInternal ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            {/* Right side — Theme toggle + auth state + mobile toggle */}
            <div className="flex items-center gap-4">
              <ThemeToggle />

              {isAuthenticated && user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href={user.role === "seller" || user.role === "admin" ? "/seller" : "/shop"}
                    className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full border border-[var(--hairline-strong)] flex items-center justify-center text-[10px]">
                                          {user.name?.charAt(0).toUpperCase() ?? "?"}
                                        </span>
                                        <span className="hidden lg:inline">{user.name?.split(" ")[0] ?? "User"}</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/" });
                    }}
                    className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--platinum)] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    href="/auth/login"
                    className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--text)] hover:text-[var(--platinum)] transition-colors border border-[var(--hairline-strong)] px-4 py-2"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

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
                    <path
                      d="M4 4l12 12M16 4L4 16"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 flex flex-col justify-center px-6 gap-2">
                {NAV_LINKS.map((link, i) => {
                  const isInternal = link.href.startsWith("/") && !link.href.startsWith("/#");
                  return isInternal ? (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1 + i * 0.06,
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="font-display text-5xl font-light py-2 border-b border-[var(--hairline)] block"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1 + i * 0.06,
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="font-display text-5xl font-light py-2 border-b border-[var(--hairline)]"
                    >
                      {link.label}
                    </motion.a>
                  );
                })}
              </nav>
              <div className="p-6 border-t border-[var(--hairline)] flex items-center justify-between">
                {isAuthenticated && user ? (
                  <div>
                    <p className="eyebrow mb-2">Signed in as</p>
                    <div className="font-display text-xl mb-2">{user.name}</div>
                    <div className="flex gap-4">
                      <Link
                        href={user.role === "seller" || user.role === "admin" ? "/seller" : "/shop"}
                        onClick={() => setMobileOpen(false)}
                        className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--platinum)] hover:underline"
                      >
                        {user.role === "seller" || user.role === "admin" ? "My Dashboard" : "Browse Shop"}
                      </Link>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--platinum)]"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="eyebrow mb-2">Account</p>
                    <div className="flex gap-4">
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileOpen(false)}
                        className="font-display text-xl hover:text-[var(--platinum)] transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setMobileOpen(false)}
                        className="font-display text-xl hover:text-[var(--platinum)] transition-colors"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
