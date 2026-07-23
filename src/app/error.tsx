"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * BAY Root Error Boundary
 *
 * Catches any uncaught error in the app. Shows a calm, on-brand
 * recovery screen — no stack traces exposed to the user.
 * Includes a retry button and a link back to safety.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error tracking service (Sentry, etc.)
    console.error("BAY Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full border border-[var(--hairline)] flex items-center justify-center mx-auto mb-8">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 4v10M14 18v4"
              stroke="var(--platinum)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="14" cy="14" r="12" stroke="var(--platinum)" strokeWidth="1" />
          </svg>
        </div>
        <div className="eyebrow-platinum mb-4">Something went wrong</div>
        <h1 className="font-display text-4xl font-light mb-4">
          An error <span className="italic-serif text-[var(--platinum)]">occurred</span>
        </h1>
        <p className="body-lg mb-8">
          We apologize for the inconvenience. Our team has been notified.
          You can try again or return to the maison.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-bay btn-bay-solid">
            <span>Try Again</span>
          </button>
          <Link href="/" className="btn-bay">
            <span>Back to Maison</span>
          </Link>
        </div>
        {error.digest && (
          <p className="spec-mono mt-8 text-[var(--text-faint)]">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
