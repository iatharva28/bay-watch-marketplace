"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * BAY MagneticButton — a button that drifts toward the cursor
 * when the cursor enters its proximity. The magnetic pull is
 * subtle (max 0.35 of the distance) so it reads as considered,
 * not gimmicky. Released back to origin on mouse leave with
 * a long easing curve.
 */
export default function MagneticButton({
  children,
  className,
  onClick,
  as: As = "button",
  href,
  strength = 0.35,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "button" | "a";
  href?: string;
  strength?: number;
  [k: string]: unknown;
}) {
  const ref = useRef<HTMLElement | null>(null);

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0, 0)";
  };

  const commonProps = {
    ref: ref as never,
    className: cn("inline-block will-change-transform", className),
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    style: { transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" },
    ...rest,
  };

  if (As === "a") {
    return (
      <a href={href} {...(commonProps as any)}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} {...(commonProps as any)}>
      {children}
    </button>
  );
}
