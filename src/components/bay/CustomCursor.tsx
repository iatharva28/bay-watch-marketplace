"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Returns `false` during SSR and on the client's first render,
 * then `true` after hydration. Uses `useSyncExternalStore` so
 * React knows the value is client-only and won't flag a
 * hydration mismatch.
 */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/**
 * BAY CustomCursor — a platinum dot with a delayed ring.
 *
 * The cursor must NOT render different markup on the server vs
 * the client, or React will throw a hydration error that
 * cascades through the rest of the tree. We use `useIsClient`
 * to return `null` on the server AND on the client's first
 * render, then mount the cursor divs after hydration.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;
    // Only enable on devices that actually have a fine pointer.
    if (window.matchMedia("(hover: none)").matches) return;
    // Respect reduced-motion — don't run the rAF loop, render a static cursor
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    };

    const tick = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const interactiveSelector =
      'a, button, [data-cursor="hover"], input[type="checkbox"], input[type="radio"]';

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(interactiveSelector)) {
        dot.classList.add("is-hover");
        ring.classList.add("is-hover");
      }
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(interactiveSelector)) {
        dot.classList.remove("is-hover");
        ring.classList.remove("is-hover");
      }
    };

    const onDown = () => ring.style.setProperty("opacity", "0.4");
    const onUp = () => ring.style.setProperty("opacity", "1");

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isClient]);

  // Always return null on first render (server + client pre-hydration).
  // Cursor divs only appear after mount + on a fine-pointer device.
  if (!isClient) return null;

  return (
    <>
      <div ref={ringRef} className="bay-cursor-ring" aria-hidden />
      <div ref={dotRef} className="bay-cursor" aria-hidden />
    </>
  );
}
