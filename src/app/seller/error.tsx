"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Seller portal error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="eyebrow-platinum mb-4">Portal Error</div>
        <h1 className="font-display text-4xl font-light mb-4">
          Dashboard <span className="italic-serif text-[var(--platinum)]">unavailable</span>
        </h1>
        <p className="body-lg mb-8">
          We couldn't load your seller dashboard. Please try again.
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
