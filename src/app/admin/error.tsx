"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="eyebrow-platinum mb-4">Admin Error</div>
        <h1 className="font-display text-4xl font-light mb-4">
          Admin panel <span className="italic-serif text-[var(--platinum)]">unavailable</span>
        </h1>
        <p className="body-lg mb-8">
          We couldn't load the admin panel. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-bay btn-bay-solid">
            <span>Retry</span>
          </button>
          <Link href="/" className="btn-bay">
            <span>Back to Maison</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
