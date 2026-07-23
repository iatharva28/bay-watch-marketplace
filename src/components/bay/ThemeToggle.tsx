"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Returns false during SSR and on the client's first render,
 * then true after hydration. Prevents hydration mismatch
 * (the toggle icon depends on the theme, which is only known
 * client-side).
 */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/**
 * Reads the current theme from the <html> class list.
 * Returns "light" or "dark".
 */
function useTheme() {
  return useSyncExternalStore(
    // Subscribe — theme doesn't change via external events, only via
    // this toggle, so no real subscription needed. We re-read on
    // every render which is triggered by the toggle's state change.
    () => () => {},
    () => {
      if (typeof document === "undefined") return "dark";
      return document.documentElement.classList.contains("light")
        ? "light"
        : "dark";
    },
    () => "dark"
  );
}

/**
 * BAY ThemeToggle — switches between Glacier Noir (dark, default)
 * and Glacier Day (light). Persists choice in localStorage. No
 * flash-of-wrong-theme because the inline script in layout.tsx
 * sets the class before first paint.
 *
 * The toggle is a minimal sun/moon icon — no labels, no chrome.
 * Sits in the navbar next to Sign In / Sign Up.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const isClient = useIsClient();
  const theme = useTheme();

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    if (next === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    try {
      localStorage.setItem("bay-theme", next);
    } catch {
      // ignore — localStorage may be unavailable
    }
  };

  // Avoid rendering the icon until mounted to prevent hydration mismatch.
  if (!isClient) {
    return (
      <button
        className={cn(
          "p-2 -mr-1 text-[var(--text-soft)] hover:text-[var(--platinum)] transition-colors",
          className
        )}
        aria-label="Toggle theme"
      >
        <span className="block w-[18px] h-[18px]" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "p-2 -mr-1 text-[var(--text-soft)] hover:text-[var(--platinum)] transition-colors",
        className
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        // Sun icon — shown when in dark mode (click to go light)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon icon — shown when in light mode (click to go dark)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
