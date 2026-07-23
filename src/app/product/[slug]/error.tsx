"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Product error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="eyebrow-platinum mb-4">Product Not Found</div>
        <h1 className="font-display text-4xl font-light mb-4">
          This piece is <span className="italic-serif text-[var(--platinum)]">unavailable</span>
        </h1>
        <p className="body-lg mb-8">
          The piece you're looking for may have been sold, discontinued,
          or the link may be incorrect.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/shop" className="btn-bay btn-bay-solid">
            <span>Browse Collection</span>
          </Link>
          <button onClick={reset} className="btn-bay">
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
