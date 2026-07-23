"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { WatchCollection } from "@/lib/bay/data";
import { cn } from "@/lib/utils";

/* =================================================================
   BAY WatchCard — an SVG representation of a watch face.
   Used in the Collections grid to render 12 different watches
   without the performance cost of 12 simultaneous 3D canvases.

   Each card renders:
     · Case + bezel (color tuned by caseFinish)
     · Dial (color from watch.dialColor)
     · Hour markers + minute track
     · Hands (animated via CSS — hour at 10:10 pose, sweeping
       second hand)
     · Complication cues: tourbillon aperture, sub-dials, GMT
       bezel, diver bezel, etc.

   On hover the card lifts, the dial brightens, and a platinum
   hairline border appears — a deliberate, restrained gesture.
   ================================================================= */

const FINISH_COLORS: Record<
  WatchCollection["caseFinish"],
  { case: string; bezel: string; sheen: string }
> = {
  "polished-platinum": {
    case: "#D8DBE0",
    bezel: "#E8EAEE",
    sheen: "#FFFFFF",
  },
  "brushed-steel": {
    case: "#A8ABB0",
    bezel: "#BFC2C7",
    sheen: "#D8DBE0",
  },
  "sandblasted-titanium": {
    case: "#7A7D83",
    bezel: "#8C9098",
    sheen: "#A8ABB0",
  },
  "obsidian-ceramic": {
    case: "#1A1C20",
    bezel: "#26292F",
    sheen: "#3F4248",
  },
};

export default function WatchCard({
  watch,
  className,
  index = 0,
}: {
  watch: WatchCollection;
  className?: string;
  index?: number;
}) {
  const finish = FINISH_COLORS[watch.caseFinish];
  const dial = watch.dialColor;

  // Random-ish seed per watch for sub-dial hand positions
  const seed = useMemo(() => {
    return (
      watch.ref
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
    );
  }, [watch.ref]);

  const showTourbillon =
    watch.complicationType === "tourbillon" ||
    watch.complicationType === "skeleton" ||
    watch.complicationType === "grand-complication";

  const showSubdials =
    watch.complicationType === "perpetual-calendar" ||
    watch.complicationType === "chronograph" ||
    watch.complicationType === "astrological" ||
    watch.complicationType === "grand-complication" ||
    watch.complicationType === "grand-sonnerie";

  const isDiver = watch.complicationType === "diver";
  const isGMT = watch.complicationType === "gmt";
  const isChronograph = watch.complicationType === "chronograph";

  // 12 hour markers — round to 4 decimals to avoid SSR/client
  // floating-point precision mismatches (hydration error)
  const markers = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    return {
      x1: (50 + Math.cos(angle) * 44).toFixed(4),
      y1: (50 + Math.sin(angle) * 44).toFixed(4),
      x2: (50 + Math.cos(angle) * 47).toFixed(4),
      y2: (50 + Math.sin(angle) * 47).toFixed(4),
      cardinal: i % 3 === 0,
    };
  });

  // Minute track
  const minuteTicks = Array.from({ length: 60 }).map((_, i) => {
    if (i % 5 === 0) return null;
    const angle = (i * 6 - 90) * (Math.PI / 180);
    return {
      x1: (50 + Math.cos(angle) * 46).toFixed(4),
      y1: (50 + Math.sin(angle) * 46).toFixed(4),
      x2: (50 + Math.cos(angle) * 47).toFixed(4),
      y2: (50 + Math.sin(angle) * 47).toFixed(4),
      key: i,
    };
  });

  // Dive bezel — 12 segments with the first 15 min marked
  const diveBezelSegments = Array.from({ length: 12 }).map((_, i) => {
    const a0 = (i * 30 - 90) * (Math.PI / 180);
    const a1 = ((i + 1) * 30 - 90) * (Math.PI / 180);
    const x0 = (50 + Math.cos(a0) * 49.5).toFixed(4);
    const y0 = (50 + Math.sin(a0) * 49.5).toFixed(4);
    const x1 = (50 + Math.cos(a1) * 49.5).toFixed(4);
    const y1 = (50 + Math.sin(a1) * 49.5).toFixed(4);
    const x2 = (50 + Math.cos(a1) * 47.5).toFixed(4);
    const y2 = (50 + Math.sin(a1) * 47.5).toFixed(4);
    const x3 = (50 + Math.cos(a0) * 47.5).toFixed(4);
    const y3 = (50 + Math.sin(a0) * 47.5).toFixed(4);
    return {
      d: `M ${x0} ${y0} A 49.5 49.5 0 0 1 ${x1} ${y1} L ${x2} ${y2} A 47.5 47.5 0 0 0 ${x3} ${y3} Z`,
      key: i,
      isZero: i === 0,
    };
  });

  return (
    <Link
      href={watch.shopSlug ? `/product/${watch.shopSlug}` : "#collections"}
      className={cn(
        "watch-card group relative aspect-[4/5] overflow-hidden block",
        className
      )}
      data-cursor="hover"
    >
      {/* Reference / number top-left */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-1">
        <span className="spec-mono">{watch.ref}</span>
        {watch.limited && (
          <span className="eyebrow-platinum">{watch.production}</span>
        )}
      </div>

      {/* Family top-right */}
      <div className="absolute top-5 right-5 z-10 text-right">
        <span className="spec-mono">{watch.family}</span>
      </div>

      {/* Watch SVG — center stage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative w-[68%] aspect-square transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          {/* Ambient halo behind watch */}
          <div
            className="absolute inset-0 rounded-full opacity-40 blur-2xl transition-opacity duration-700 group-hover:opacity-80"
            style={{
              background:
                "radial-gradient(circle, rgba(200,204,211,0.18) 0%, transparent 70%)",
            }}
          />
          <svg
            viewBox="0 0 100 100"
            className="relative w-full h-full"
            style={{
              filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.6))",
            }}
          >
            <defs>
              {/* Case gradient — radial for a polished metal look */}
              <radialGradient
                id={`case-grad-${watch.id}`}
                cx="35%"
                cy="30%"
                r="80%"
              >
                <stop offset="0%" stopColor={finish.sheen} />
                <stop offset="60%" stopColor={finish.case} />
                <stop offset="100%" stopColor="#000" />
              </radialGradient>
              {/* Dial gradient — subtle radial for sunburst feel */}
              <radialGradient
                id={`dial-grad-${watch.id}`}
                cx="50%"
                cy="40%"
                r="80%"
              >
                <stop offset="0%" stopColor={dial} stopOpacity="1" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
              </radialGradient>
              {/* Bezel ring gradient */}
              <linearGradient
                id={`bezel-grad-${watch.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={finish.sheen} />
                <stop offset="50%" stopColor={finish.bezel} />
                <stop offset="100%" stopColor={finish.case} />
              </linearGradient>
            </defs>

            {/* Outer case shadow ring */}
            <circle cx="50" cy="50" r="49.5" fill="#000" opacity="0.5" />

            {/* Case outer ring */}
            <circle
              cx="50"
              cy="50"
              r="49"
              fill={`url(#case-grad-${watch.id})`}
            />

            {/* Bezel — diver or GMT has notched/scaled bezel */}
            {isDiver &&
              diveBezelSegments.map((s) => (
                <path
                  key={s.key}
                  d={s.d}
                  fill={s.isZero ? "#C8CCD3" : "transparent"}
                  stroke="#000"
                  strokeWidth="0.15"
                  opacity={s.isZero ? 1 : 0.6}
                />
              ))}
            {isGMT && (
              <>
                <circle
                  cx="50"
                  cy="50"
                  r="48.5"
                  fill="none"
                  stroke="#2E4051"
                  strokeWidth="2"
                />
                {/* 24-hour numerals */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 15 - 90) * (Math.PI / 180);
                  const x = (50 + Math.cos(angle) * 47).toFixed(4);
                  const y = (50 + Math.sin(angle) * 47).toFixed(4);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      fontSize="1.8"
                      fill="#A8BCC7"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="monospace"
                    >
                      {i}
                    </text>
                  );
                })}
              </>
            )}
            {!isDiver && !isGMT && (
              <circle
                cx="50"
                cy="50"
                r="47.5"
                fill="none"
                stroke={`url(#bezel-grad-${watch.id})`}
                strokeWidth="2.5"
              />
            )}

            {/* Dial */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#dial-grad-${watch.id})`}
            />

            {/* Minute track */}
            {minuteTicks.map(
              (m) =>
                m && (
                  <line
                    key={m.key}
                    x1={m.x1}
                    y1={m.y1}
                    x2={m.x2}
                    y2={m.y2}
                    stroke="#3F4248"
                    strokeWidth="0.3"
                  />
                )
            )}

            {/* Hour markers */}
            {markers.map((m, i) => (
              <line
                key={i}
                x1={m.x1}
                y1={m.y1}
                x2={m.x2}
                y2={m.y2}
                stroke="#C8CCD3"
                strokeWidth={m.cardinal ? 1.2 : 0.6}
                strokeLinecap="round"
              />
            ))}

            {/* Tourbillon aperture at 6 o'clock */}
            {showTourbillon && (
              <g>
                <circle
                  cx="50"
                  cy="68"
                  r="8"
                  fill="#08090B"
                  stroke="#3F4248"
                  strokeWidth="0.3"
                />
                {/* tourbillon cage — 3 spokes, slow rotation via CSS. Speeds up on hover. */}
                <g
                  className="watch-tourbillon-cage"
                  style={{
                    transformOrigin: "50px 68px",
                    animation: "hand-spin 8s linear infinite",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <line
                      key={i}
                      x1="50"
                      y1="68"
                      x2={(50 + Math.cos((i * 2 * Math.PI) / 3) * 6).toFixed(4)}
                      y2={(68 + Math.sin((i * 2 * Math.PI) / 3) * 6).toFixed(4)}
                      stroke="#C8CCD3"
                      strokeWidth="0.4"
                    />
                  ))}
                  <circle cx="50" cy="68" r="1" fill="#6B8E9B" />
                </g>
              </g>
            )}

            {/* Sub-dials for complications */}
            {showSubdials &&
              [
                { cx: 35, cy: 35 },
                { cx: 65, cy: 35 },
                { cx: 35, cy: 65 },
                { cx: 65, cy: 65 },
              ].map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r="7"
                    fill="#08090B"
                    stroke="#3F4248"
                    strokeWidth="0.3"
                  />
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r="6.5"
                    fill="none"
                    stroke="#2a2d34"
                    strokeWidth="0.2"
                  />
                  {/* sub-dial hand */}
                  <line
                    x1={p.cx}
                    y1={p.cy}
                    x2={
                      (p.cx + Math.cos((seed + i * 90 - 90) * (Math.PI / 180)) * 5).toFixed(4)
                    }
                    y2={
                      (p.cy + Math.sin((seed + i * 90 - 90) * (Math.PI / 180)) * 5).toFixed(4)
                    }
                    stroke="#C8CCD3"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                  />
                  <circle cx={p.cx} cy={p.cy} r="0.6" fill="#C8CCD3" />
                </g>
              ))}

            {/* Date window at 3 o'clock for chronograph / time-only / diver */}
            {(isChronograph ||
              watch.complicationType === "time-only" ||
              watch.complicationType === "diver") && (
              <g>
                <rect
                  x="70"
                  y="46"
                  width="8"
                  height="8"
                  fill="#0C0D10"
                  stroke="#3F4248"
                  strokeWidth="0.3"
                />
                <text
                  x="74"
                  y="51.5"
                  fontSize="3.5"
                  fill="#C8CCD3"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  14
                </text>
              </g>
            )}

            {/* Hands — hour at 10:10 pose */}
            <g
              style={{
                transformOrigin: "50px 50px",
                transform: "rotate(-60deg)",
              }}
            >
              <rect
                x="49.4"
                y="32"
                width="1.2"
                height="20"
                fill="#E8EAEE"
                rx="0.3"
              />
            </g>
            <g
              style={{
                transformOrigin: "50px 50px",
                transform: "rotate(30deg)",
              }}
            >
              <rect
                x="49.5"
                y="25"
                width="1"
                height="27"
                fill="#E8EAEE"
                rx="0.3"
              />
            </g>
            {/* Second hand — sweeping. Speeds up on hover for a "tick" delight moment. */}
            <g
              className="watch-second-hand"
              style={{
                transformOrigin: "50px 50px",
                animation: "hand-spin 60s linear infinite",
              }}
            >
              <rect
                x="49.7"
                y="22"
                width="0.6"
                height="32"
                fill="#A8BCC7"
                rx="0.2"
              />
              <circle cx="50" cy="60" r="1.2" fill="#A8BCC7" />
            </g>

            {/* Center pin */}
            <circle cx="50" cy="50" r="1.4" fill="#E8EAEE" />
            <circle cx="50" cy="50" r="0.5" fill="#08090B" />

            {/* Crown — at 3 o'clock. Rotates on hover for a delight moment. */}
            <g
              className="watch-crown"
              style={{ transformOrigin: "97px 50px", transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}
            >
              <rect
                x="95"
                y="47"
                width="4"
                height="6"
                fill={finish.case}
                rx="0.5"
              />
              <rect
                x="98.5"
                y="48"
                width="1.5"
                height="4"
                fill={finish.bezel}
                rx="0.3"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Card bottom — name, tagline, price */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-display text-3xl font-light leading-none">
                {watch.name}
              </h3>
              <span className="spec-mono">{watch.caseDiameter}</span>
            </div>
            <p className="body-md text-[var(--text-soft)] line-clamp-1">
              {watch.tagline}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="spec-mono mb-1">From</div>
            <div className="font-mono text-sm text-[var(--text)]">
              {watch.price}
            </div>
          </div>
        </div>
        {/* Hover reveal — complication + movement */}
        <div className="mt-4 pt-4 border-t border-[var(--hairline)] flex items-center justify-between opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:max-h-20">
          <span className="spec-mono">{watch.complication}</span>
          <span className="link-bay">
            Discover
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 6h6m0 0L6 3m3 3L6 9"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
