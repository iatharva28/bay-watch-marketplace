"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="eyebrow-platinum mb-4">Shop Error</div>
        <h1 className="font-display text-4xl font-light mb-4">
          Couldn't load the <span className="italic-serif text-[var(--platinum)]">collection</span>
        </h1>
        <p className="body-lg mb-8">
          We're having trouble loading the marketplace. Please try again.
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
