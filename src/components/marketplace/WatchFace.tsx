"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * BAY WatchFace — a compact SVG watch face for marketplace contexts
 * (product cards, cart drawer, order history). Lighter than the
 * marketing WatchCard — no hover animations, just the dial.
 *
 * Reuses the same Glacier Noir rendering language so marketplace
 * pages feel like part of the maison, not a separate shop.
 */

const FINISH_COLORS: Record<string, { case: string; bezel: string; sheen: string }> = {
  "polished-platinum": { case: "#D8DBE0", bezel: "#E8EAEE", sheen: "#FFFFFF" },
  "brushed-steel": { case: "#A8ABB0", bezel: "#BFC2C7", sheen: "#D8DBE0" },
  "sandblasted-titanium": { case: "#7A7D83", bezel: "#8C9098", sheen: "#A8ABB0" },
  "obsidian-ceramic": { case: "#1A1C20", bezel: "#26292F", sheen: "#3F4248" },
};

function WatchFaceInner({
  dialColor,
  caseFinish,
  complicationType,
  size = 200,
  className,
}: {
  dialColor: string;
  caseFinish: string;
  complicationType: string;
  size?: number;
  className?: string;
}) {
  const finish = FINISH_COLORS[caseFinish] ?? FINISH_COLORS["polished-platinum"];
  const showTourbillon =
    complicationType === "tourbillon" ||
    complicationType === "skeleton" ||
    complicationType === "grand-complication";
  const showSubdials =
    complicationType === "perpetual-calendar" ||
    complicationType === "chronograph" ||
    complicationType === "astrological" ||
    complicationType === "grand-sonnerie";
  const isDiver = complicationType === "diver";
  const isGMT = complicationType === "gmt";
  const isChronograph = complicationType === "chronograph";

  const markers = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      return {
        x1: (50 + Math.cos(angle) * 44).toFixed(4),
        y1: (50 + Math.sin(angle) * 44).toFixed(4),
        x2: (50 + Math.cos(angle) * 47).toFixed(4),
        y2: (50 + Math.sin(angle) * 47).toFixed(4),
        cardinal: i % 3 === 0,
      };
    });
  }, []);

  const minuteTicks = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
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
  }, []);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("block", className)}
      style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}
    >
      <defs>
        <radialGradient id={`wf-case-${caseFinish}-${dialColor}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={finish.sheen} />
          <stop offset="60%" stopColor={finish.case} />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <radialGradient id={`wf-dial-${caseFinish}-${dialColor}`} cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor={dialColor} />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="49.5" fill="#000" opacity="0.5" />
      <circle cx="50" cy="50" r="49" fill={`url(#wf-case-${caseFinish}-${dialColor})`} />

      {isDiver && (
        <circle cx="50" cy="50" r="48.5" fill="none" stroke="#2E4051" strokeWidth="2" />
      )}
      {isGMT && (
        <>
          <circle cx="50" cy="50" r="48.5" fill="none" stroke="#2E4051" strokeWidth="2" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 - 90) * (Math.PI / 180);
            return (
              <text
                key={i}
                x={(50 + Math.cos(angle) * 47).toFixed(4)}
                y={(50 + Math.sin(angle) * 47).toFixed(4)}
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
        <circle cx="50" cy="50" r="47.5" fill="none" stroke={finish.bezel} strokeWidth="2.5" />
      )}

      <circle cx="50" cy="50" r="45" fill={`url(#wf-dial-${caseFinish}-${dialColor})`} />

      {minuteTicks.map(
        (m) =>
          m && (
            <line key={m.key} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#3F4248" strokeWidth="0.3" />
          )
      )}
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

      {showTourbillon && (
        <g>
          <circle cx="50" cy="68" r="8" fill="#08090B" stroke="#3F4248" strokeWidth="0.3" />
          <g
            className="watch-tourbillon-cage"
            style={{ transformOrigin: "50px 68px", animation: "hand-spin 8s linear infinite" }}
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

      {showSubdials &&
        [
          { cx: 35, cy: 35 },
          { cx: 65, cy: 35 },
          { cx: 35, cy: 65 },
          { cx: 65, cy: 65 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r="7" fill="#08090B" stroke="#3F4248" strokeWidth="0.3" />
            <line
              x1={p.cx}
              y1={p.cy}
              x2={(p.cx + Math.cos((i * 90 - 90) * (Math.PI / 180)) * 5).toFixed(4)}
              y2={(p.cy + Math.sin((i * 90 - 90) * (Math.PI / 180)) * 5).toFixed(4)}
              stroke="#C8CCD3"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
            <circle cx={p.cx} cy={p.cy} r="0.6" fill="#C8CCD3" />
          </g>
        ))}

      {(isChronograph || complicationType === "time-only" || complicationType === "diver") && (
        <g>
          <rect x="70" y="46" width="8" height="8" fill="#0C0D10" stroke="#3F4248" strokeWidth="0.3" />
          <text x="74" y="51.5" fontSize="3.5" fill="#C8CCD3" textAnchor="middle" fontFamily="monospace">
            14
          </text>
        </g>
      )}

      {/* Hour hand at 10:10 */}
      <g style={{ transformOrigin: "50px 50px", transform: "rotate(-60deg)" }}>
        <rect x="49.4" y="32" width="1.2" height="20" fill="#E8EAEE" rx="0.3" />
      </g>
      <g style={{ transformOrigin: "50px 50px", transform: "rotate(30deg)" }}>
        <rect x="49.5" y="25" width="1" height="27" fill="#E8EAEE" rx="0.3" />
      </g>
      {/* Second hand — sweeping */}
      <g
        className="watch-second-hand"
        style={{ transformOrigin: "50px 50px", animation: "hand-spin 60s linear infinite" }}
      >
        <rect x="49.7" y="22" width="0.6" height="32" fill="#A8BCC7" rx="0.2" />
        <circle cx="50" cy="60" r="1.2" fill="#A8BCC7" />
      </g>

      <circle cx="50" cy="50" r="1.4" fill="#E8EAEE" />
      <circle cx="50" cy="50" r="0.5" fill="#08090B" />

      {/* Crown */}
      <g className="watch-crown" style={{ transformOrigin: "97px 50px", transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
        <rect x="95" y="47" width="4" height="6" fill={finish.case} rx="0.5" />
        <rect x="98.5" y="48" width="1.5" height="4" fill={finish.bezel} rx="0.3" />
      </g>
    </svg>
  );
}

/**
 * Memoized export — prevents unnecessary SVG re-renders when parent
 * components update (e.g. cart drawer opening, filter changes).
 * The watch face only re-renders if its own props change.
 */
export default memo(WatchFaceInner);

