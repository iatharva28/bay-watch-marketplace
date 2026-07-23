"use client";

import { useEffect, useState } from "react";

/**
 * BAY Loader — appears on first paint, then exits with a
 * curtain reveal. The loader shows the BAY wordmark with
 * an animated seconds-hand sweep and a counter from 00 to 100,
 * creating the impression of a watch being wound before the
 * experience begins. The exit animation splits the panel
 * vertically to reveal the hero — the first "watch movement"
 * the user witnesses.
 *
 * Implementation note: this component deliberately avoids
 * framer-motion's AnimatePresence because motion.div with an
 * `exit` prop injects computed inline styles during hydration
 * that don't match the SSR output, triggering a React
 * hydration-mismatch error. We use plain divs + CSS transitions
 * instead, which are SSR-safe.
 */
export default function Loader({ onDone }: { onDone?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      // ease-out progression
      p += Math.max(1, (100 - p) * 0.06);
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        // Trigger exit animation, then notify parent after it completes
        setExiting(true);
        setTimeout(() => {
          setRemoved(true);
          onDone?.();
        }, 1100);
      }
      setProgress(Math.floor(p));
    }, 40);
    return () => clearInterval(interval);
  }, [onDone]);

  // seconds hand sweep — 6 degrees per "second" of load time
  const handRotation = (progress / 100) * 360 * 2;

  if (removed) return null;

  return (
    <div
      aria-hidden={exiting}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)] transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.87,0,0.13,1)]"
      style={{
        clipPath: exiting
          ? "polygon(0 0, 100% 0, 100% 0, 0 0)"
          : "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      }}
    >
      {/* Aurora wash */}
      <div className="aurora-wash" />

      <div className="relative flex flex-col items-center">
        {/* Watch dial — animated seconds hand */}
        <div className="relative w-32 h-32 mb-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* outer ring */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="var(--hairline-strong)"
              strokeWidth="0.5"
            />
            {/* hour markers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = (50 + Math.cos(angle) * 44).toFixed(4);
              const y1 = (50 + Math.sin(angle) * 44).toFixed(4);
              const x2 = (50 + Math.cos(angle) * 46).toFixed(4);
              const y2 = (50 + Math.sin(angle) * 46).toFixed(4);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--platinum)"
                  strokeWidth="0.8"
                />
              );
            })}
            {/* minute markers */}
            {Array.from({ length: 60 }).map((_, i) => {
              if (i % 5 === 0) return null;
              const angle = (i * 6 - 90) * (Math.PI / 180);
              const x1 = (50 + Math.cos(angle) * 45).toFixed(4);
              const y1 = (50 + Math.sin(angle) * 45).toFixed(4);
              const x2 = (50 + Math.cos(angle) * 46.5).toFixed(4);
              const y2 = (50 + Math.sin(angle) * 46.5).toFixed(4);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--text-faint)"
                  strokeWidth="0.3"
                />
              );
            })}
            {/* seconds hand */}
            <g
              style={{
                transformOrigin: "50px 50px",
                transform: `rotate(${handRotation}deg)`,
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <line
                x1="50"
                y1="58"
                x2="50"
                y2="14"
                stroke="var(--platinum)"
                strokeWidth="0.6"
                strokeLinecap="round"
              />
            </g>
            {/* center pin */}
            <circle cx="50" cy="50" r="1.5" fill="var(--platinum)" />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <div className="font-display text-5xl font-light tracking-[0.3em] text-[var(--text)] pl-[0.3em]">
            BAY
          </div>
          <div className="eyebrow mt-3">
            Maison Horlogère · Est. 1947
          </div>
        </div>

        {/* Counter */}
        <div className="mt-12 flex items-baseline gap-3">
          <span
            className="font-mono text-xs text-[var(--text-muted)]"
            style={{ fontFeatureSettings: "'tnum'" }}
          >
            {String(progress).padStart(3, "0")}
          </span>
          <div className="w-32 h-px bg-[var(--hairline)] relative">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--platinum)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono text-xs text-[var(--text-faint)]">
            100
          </span>
        </div>
      </div>
    </div>
  );
}
