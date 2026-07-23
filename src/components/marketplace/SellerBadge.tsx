"use client";

import { cn } from "@/lib/utils";

/**
 * BAY SellerBadge — displays the seller's verification level.
 *   own_brand → "BAY Maison" (platinum)
 *   authorized → "BAY Authorized" (steel blue)
 *   vendor → "Verified Vendor" (muted)
 */
export default function SellerBadge({
  type,
  className,
  size = "sm",
}: {
  type: "own_brand" | "authorized" | "vendor";
  className?: string;
  size?: "sm" | "md";
}) {
  const config = {
    own_brand: {
      label: "BAY Maison",
      classes: "border-[var(--platinum)] text-[var(--platinum)]",
    },
    authorized: {
      label: "BAY Authorized",
      classes: "border-[var(--steel)] text-[var(--steel)]",
    },
    vendor: {
      label: "Verified Vendor",
      classes: "border-[var(--text-muted)] text-[var(--text-muted)]",
    },
  }[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-mono uppercase tracking-[0.18em]",
        size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]",
        config.classes,
        className
      )}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
