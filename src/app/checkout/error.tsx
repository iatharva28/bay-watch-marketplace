"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Checkout error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="eyebrow-platinum mb-4">Checkout Error</div>
        <h1 className="font-display text-4xl font-light mb-4">
          Checkout <span className="italic-serif text-[var(--platinum)]">interrupted</span>
        </h1>
        <p className="body-lg mb-8">
          We couldn't complete your checkout. Your cart is safe.
          Please try again or contact us if the issue persists.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-bay btn-bay-solid">
            <span>Retry Checkout</span>
          </button>
          <Link href="/cart" className="btn-bay">
            <span>Back to Cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
