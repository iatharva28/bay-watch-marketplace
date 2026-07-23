"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { WATCHES } from "@/lib/bay/data";
import { useWatchDrivers } from "./Watch3D";
import MagneticButton from "./MagneticButton";

/**
 * BAY Hero — the opening scene of the experience.
 *
 * Layout: split-screen.
 *   · Left: editorial copy — eyebrow, display headline, manifesto
 *     paragraph, two CTAs.
 *   · Right: a 3D watch (React Three Fiber) rendered procedurally
 *     and reacting to scroll position. As the user scrolls down,
 *     the watch rotates through ~540°, tilts on X, and subtly
 *     scales — creating the "watch does something when you
 *     move to the next page" effect requested by the user.
 *
 * The hero is the first section that demonstrates the maison's
 * motion language: long, considered easing; minimal but precise
 * parallax; and the watch treated as a living object.
 */

const Watch3D = dynamic(() => import("./Watch3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-48 h-48 rounded-full shimmer" />
    </div>
  ),
});

const FEATURED_WATCH = WATCHES.find((w) => w.id === "meridian")!;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollProgressRef, mousePosRef } = useWatchDrivers();
  const [activeIndex, setActiveIndex] = useState(0);

  // Cycle the featured watch every 6 seconds — a quiet rotation
  // through the maison's hero pieces, not a fast carousel.
  const featuredWatches = WATCHES.filter((w) => w.featured);
  const [activeWatch, setActiveWatch] = useState(FEATURED_WATCH);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % featuredWatches.length;
        setActiveWatch(featuredWatches[next]);
        return next;
      });
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredWatches.length]);

  // Drive the scroll ref from framer's useScroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      scrollProgressRef.current = v;
    });
  }, [scrollYProgress, scrollProgressRef]);

  // Mouse parallax for the watch
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mousePosRef.current.x = x;
      mousePosRef.current.y = y;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mousePosRef]);

  // Copy parallax — gentle drift as you scroll
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  // Aurora parallax — background drifts slower than copy for depth
  const auroraY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const auroraScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative min-h-screen flex items-center pt-24 lg:pt-0 overflow-hidden"
    >
      {/* Aurora background — parallax on scroll for cinematic depth */}
      <motion.div
        style={{ y: auroraY, scale: auroraScale }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="aurora-wash" />
        {/* Extra radial glow behind the watch */}
        <div
          className="absolute top-1/2 right-1/4 w-[600px] h-[600px] -translate-y-1/2 rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(200,204,211,0.15) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Vertical grid lines — quiet structure */}
      <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-[0.5]">
        {[...Array(13)].map((_, i) => (
          <div
            key={i}
            className="border-l border-[var(--hairline)] h-full"
            style={{ gridColumn: `${i + 1} / ${i + 1}` }}
          />
        ))}
      </div>

      <div className="relative max-w-[1600px] mx-auto w-full px-6 lg:px-10 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left — editorial copy */}
        <motion.div
          style={{ y: copyY, opacity: copyOpacity }}
          className="relative z-10 max-w-2xl"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-8 h-px bg-[var(--platinum)]" />
            <span className="eyebrow-platinum">Maison Horlogère · Est. 1947</span>
          </motion.div>

          {/* Display headline */}
          <h1 className="display-1 text-[var(--text)] mb-6">
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              Quiet
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="block italic-serif text-[var(--platinum)]"
            >
              Luxury.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              Timeless
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="block italic-serif text-[var(--platinum)]"
            >
              Precision.
            </motion.span>
          </h1>

          {/* Body copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="body-lg max-w-md mb-10"
          >
            BAY is a modern Swiss-inspired watch maison. We do not
            compete through loud marketing — only through
            craftsmanship, mechanical excellence, and design that
            outlives the moment.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-4"
          >
            <MagneticButton
              as="a"
              href="/shop"
              className="btn-bay btn-bay-solid"
            >
              <span>Enter the Shop</span>
            </MagneticButton>
            <MagneticButton as="a" href="#collections" className="btn-bay">
              <span>View the Collection</span>
            </MagneticButton>
          </motion.div>

          {/* Featured watch indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="mt-16 flex items-center gap-6"
          >
            <span className="eyebrow">Now Featuring</span>
            <div className="h-px flex-1 bg-[var(--hairline)]" />
            <div className="text-right">
              <div className="font-display text-xl">
                {activeWatch.name}
              </div>
              <div className="spec-mono mt-1">
                {activeWatch.ref} · {activeWatch.price}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right — 3D watch */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-square lg:aspect-[4/5] max-h-[80vh] w-full"
        >
          {/* Concentric guide rings — slow rotation */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[90%] aspect-square rounded-full border border-[var(--hairline)] slow-rotate" />
            <div className="absolute w-[75%] aspect-square rounded-full border border-dashed border-[var(--hairline)] slow-rotate" style={{ animationDirection: "reverse", animationDuration: "90s" }} />
          </div>

          {/* Tick markers around the watch — like an outer dial */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-[80%] h-[80%] opacity-30">
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = (i * 6 - 90) * (Math.PI / 180);
                const isCardinal = i % 5 === 0;
                const r1 = isCardinal ? 92 : 94;
                const r2 = 96;
                // Round to 4 decimals to avoid SSR/client float precision mismatch
                return (
                  <line
                    key={i}
                    x1={(100 + Math.cos(angle) * r1).toFixed(4)}
                    y1={(100 + Math.sin(angle) * r1).toFixed(4)}
                    x2={(100 + Math.cos(angle) * r2).toFixed(4)}
                    y2={(100 + Math.sin(angle) * r2).toFixed(4)}
                    stroke={isCardinal ? "#C8CCD3" : "#3F4248"}
                    strokeWidth={isCardinal ? 0.6 : 0.3}
                  />
                );
              })}
            </svg>
          </div>

          {/* The watch canvas */}
          <div className="absolute inset-[10%]">
            <Watch3D
              watch={activeWatch}
              scrollProgressRef={scrollProgressRef}
              mousePosRef={mousePosRef}
            />
          </div>

          {/* Floating spec labels */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="absolute top-[15%] right-0 hidden lg:block"
          >
            <div className="spec-mono mb-1">Caliber</div>
            <div className="font-mono text-xs text-[var(--text)]">
              {activeWatch.movement.split("—")[0].trim()}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 2 }}
            className="absolute bottom-[18%] left-0 hidden lg:block"
          >
            <div className="spec-mono mb-1">Case</div>
            <div className="font-mono text-xs text-[var(--text)]">
              {activeWatch.caseMaterial}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.2 }}
            className="absolute bottom-[5%] right-[10%] hidden lg:block"
          >
            <div className="spec-mono mb-1">Production</div>
            <div className="font-mono text-xs text-[var(--platinum)]">
              {activeWatch.production}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="eyebrow">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-[var(--platinum)] to-transparent" />
      </motion.div>
    </section>
  );
}
