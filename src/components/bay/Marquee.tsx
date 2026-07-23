"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * BAY Marquee — an infinite horizontal scroll of content.
 * Used for the brand manifesto band beneath the hero. The
 * track is duplicated so the animation loops seamlessly.
 */
export default function Marquee({
  children,
  duration = 40,
  className,
  reverse = false,
}: {
  children: ReactNode;
  duration?: number;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        className
      )}
      aria-hidden
    >
      <div
        className="marquee-track"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className="inline-flex">{children}</div>
        <div className="inline-flex" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
