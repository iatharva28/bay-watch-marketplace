"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { WATCHES } from "@/lib/bay/data";

/**
 * BAY Movements — a horizontal-scrolling showcase of the
 * maison's calibers. Each card represents a movement family
 * with its specification and the watch it powers. As the
 * user scrolls vertically through this section, the cards
 * translate horizontally — a classic Awwwards interaction
 * that frames each movement as a piece of mechanical art.
 */
export default function Movements() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Translate from 0 to -(totalWidth - viewportWidth)
  // Approximate: 12 cards × 480px = 5760px, minus viewport ~1200px = ~4500px
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-78%"]);

  // Pick a representative set — 8 movements to show variety
  const featuredMovements = WATCHES.slice(0, 8);

  return (
    <section
      ref={ref}
      id="movements"
      className="relative h-[280vh] bg-[var(--bg-soft)]"
    >
      {/* Sticky horizontal stage */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        {/* Section header */}
        <div className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 pt-32 pb-8">
          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="section-num">02</span>
                <span className="w-12 h-px bg-[var(--hairline)]" />
                <span className="eyebrow">Movements</span>
              </div>
              <h2 className="display-2 text-[var(--text)]">
                In-house calibers,
                <br />
                <span className="italic-serif text-[var(--platinum)]">
                  one bench at a time.
                </span>
              </h2>
            </div>
            <p className="body-md max-w-sm">
              Every BAY movement is conceived, prototyped, and
              assembled within the maison. Scroll to explore the
              calibers that power the collection.
            </p>
          </div>
        </div>

        {/* Horizontal track */}
        <div className="flex-1 flex items-center">
          <motion.div
            style={{ x }}
            className="flex gap-6 lg:gap-8 px-6 lg:px-10 will-change-transform"
          >
            {featuredMovements.map((watch, i) => (
              <MovementCard
                key={watch.id}
                watch={watch}
                index={i}
              />
            ))}

            {/* End card */}
            <div className="shrink-0 w-[60vw] lg:w-[40vw] h-[55vh] flex flex-col justify-center px-8 border-l border-[var(--hairline)]">
              <div className="eyebrow mb-4">And beyond</div>
              <h3 className="display-3 text-[var(--text)] mb-6">
                Calibers in development, not yet named.
              </h3>
              <p className="body-lg max-w-md mb-8">
                The next BAY movement has been on the bench for
                three years. When it is ready, you will read
                about it here first.
              </p>
              <a href="#journal" className="link-bay">
                Read the journal
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 6h6m0 0L6 3m3 3L6 9"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MovementCard({
  watch,
  index,
}: {
  watch: (typeof WATCHES)[number];
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="shrink-0 w-[78vw] sm:w-[55vw] lg:w-[36vw] xl:w-[30vw] h-[55vh] surface-elevated relative overflow-hidden group"
    >
      {/* Aurora wash on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="aurora-wash" />
      </div>

      <div className="relative h-full p-8 lg:p-10 flex flex-col">
        {/* Top — caliber number + watch name */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Caliber</div>
            <div className="font-mono text-2xl text-[var(--text)]">
              {watch.movement.split("—")[0].replace("BAY Cal.", "").trim()}
            </div>
          </div>
          <div className="text-right">
            <div className="spec-mono mb-1">{watch.ref}</div>
            <div className="font-display text-3xl">{watch.name}</div>
          </div>
        </div>

        {/* Center — abstract movement visualization */}
        <div className="flex-1 flex items-center justify-center relative my-6">
          <svg viewBox="0 0 200 200" className="w-full max-w-[280px] aspect-square">
            <defs>
              <radialGradient id={`mov-grad-${watch.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={watch.dialColor} stopOpacity="1" />
                <stop offset="100%" stopColor="#08090B" stopOpacity="1" />
              </radialGradient>
            </defs>
            {/* Outer movement ring */}
            <circle cx="100" cy="100" r="95" fill={`url(#mov-grad-${watch.id})`} stroke="#3F4248" strokeWidth="0.5" />
            {/* Gear — main */}
            <g
              style={{
                transformOrigin: "100px 100px",
                animation: "hand-spin 30s linear infinite",
              }}
            >
              <MainGear />
            </g>
            {/* Gear — secondary */}
            <g
              style={{
                transformOrigin: "60px 80px",
                animation: "hand-spin 18s linear infinite reverse",
              }}
            >
              <SecondaryGear cx={60} cy={80} />
            </g>
            {/* Gear — tertiary */}
            <g
              style={{
                transformOrigin: "140px 130px",
                animation: "hand-spin 22s linear infinite",
              }}
            >
              <SecondaryGear cx={140} cy={130} />
            </g>
            {/* Balance wheel — oscillating */}
            <g
              style={{
                transformOrigin: "100px 60px",
                animation: "hand-spin 4s ease-in-out infinite alternate",
              }}
            >
              <BalanceWheel cx={100} cy={60} />
            </g>
          </svg>
        </div>

        {/* Bottom — spec grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6 border-t border-[var(--hairline)]">
          <Spec label="Frequency" value={watch.movement.match(/\d+,?\d*\s*vph/)?.[0] ?? "21,600 vph"} />
          <Spec label="Power Reserve" value={watch.powerReserve} />
          <Spec label="Jewels" value="32" />
          <Spec label="Components" value={String(180 + index * 40)} />
        </div>
      </div>
    </motion.article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="spec-mono mb-1">{label}</div>
      <div className="font-mono text-xs text-[var(--text)]">{value}</div>
    </div>
  );
}

function MainGear() {
  // 24-tooth gear — round to 4 decimals to avoid SSR/client float mismatch
  const teeth = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i * 15) * (Math.PI / 180);
    return (
      <line
        key={i}
        x1={(100 + Math.cos(angle) * 60).toFixed(4)}
        y1={(100 + Math.sin(angle) * 60).toFixed(4)}
        x2={(100 + Math.cos(angle) * 68).toFixed(4)}
        y2={(100 + Math.sin(angle) * 68).toFixed(4)}
        stroke="#C8CCD3"
        strokeWidth="2"
      />
    );
  });
  return (
    <g>
      {teeth}
      <circle cx="100" cy="100" r="60" fill="none" stroke="#C8CCD3" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="#8C9098" strokeWidth="0.6" strokeDasharray="2 4" />
      {/* spokes */}
      {[0, 60, 120].map((a) => (
        <line
          key={a}
          x1={(100 + Math.cos((a * Math.PI) / 180) * 20).toFixed(4)}
          y1={(100 + Math.sin((a * Math.PI) / 180) * 20).toFixed(4)}
          x2={(100 + Math.cos((a * Math.PI) / 180) * 58).toFixed(4)}
          y2={(100 + Math.sin((a * Math.PI) / 180) * 58).toFixed(4)}
          stroke="#A8ABB0"
          strokeWidth="2"
        />
      ))}
      <circle cx="100" cy="100" r="8" fill="#2E4051" />
      <circle cx="100" cy="100" r="3" fill="#C8CCD3" />
    </g>
  );
}

function SecondaryGear({ cx, cy }: { cx: number; cy: number }) {
  const teeth = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i * 22.5) * (Math.PI / 180);
    return (
      <line
        key={i}
        x1={(cx + Math.cos(angle) * 22).toFixed(4)}
        y1={(cy + Math.sin(angle) * 22).toFixed(4)}
        x2={(cx + Math.cos(angle) * 28).toFixed(4)}
        y2={(cy + Math.sin(angle) * 28).toFixed(4)}
        stroke="#8C9098"
        strokeWidth="1.2"
      />
    );
  });
  return (
    <g>
      {teeth}
      <circle cx={cx} cy={cy} r="22" fill="none" stroke="#8C9098" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="4" fill="#2E4051" />
    </g>
  );
}

function BalanceWheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="16" fill="none" stroke="#A8BCC7" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="12" fill="none" stroke="#6B8E9B" strokeWidth="0.5" strokeDasharray="1 2" />
      {/* spokes */}
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1={(cx + Math.cos((a * Math.PI) / 180) * 4).toFixed(4)}
          y1={(cy + Math.sin((a * Math.PI) / 180) * 4).toFixed(4)}
          x2={(cx + Math.cos((a * Math.PI) / 180) * 15).toFixed(4)}
          y2={(cy + Math.sin((a * Math.PI) / 180) * 15).toFixed(4)}
          stroke="#A8BCC7"
          strokeWidth="1"
        />
      ))}
      <circle cx={cx} cy={cy} r="2" fill="#C8CCD3" />
    </g>
  );
}
