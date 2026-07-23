"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { WATCHES, type WatchCollection } from "@/lib/bay/data";
import WatchCard from "./WatchCard";
import MagneticButton from "./MagneticButton";
import { cn } from "@/lib/utils";

/**
 * BAY Collections — the maison's complete offering.
 * Twelve collections, filling the page with the visual
 * richness of a multi-million dollar house. Filter by
 * family with a quiet horizontal selector.
 */

type Filter = "All" | WatchCollection["family"];

const FAMILIES: Filter[] = [
  "All",
  "Flagship",
  "Grand Complications",
  "Travel",
  "Sport",
  "Ultra-Thin",
];

export default function Collections() {
  const [filter, setFilter] = useState<Filter>("All");
  const sectionRef = useRef<HTMLElement>(null);

  const filtered =
    filter === "All"
      ? WATCHES
      : WATCHES.filter((w) => w.family === filter);

  return (
    <section
      ref={sectionRef}
      id="collections"
      className="relative py-32 lg:py-48"
    >
      {/* Section header */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 mb-20">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <span className="section-num">01</span>
              <span className="w-12 h-px bg-[var(--hairline)]" />
              <span className="eyebrow">Collections</span>
            </div>
            <h2 className="display-2 text-[var(--text)] mb-6">
              Twelve expressions
              <br />
              of <span className="italic-serif text-[var(--platinum)]">one philosophy.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8">
            <p className="body-lg">
              From the time-only Meridian to the five-complication
              Zenith, each BAY is a distinct statement — yet every
              piece shares the same restraint, the same hand-finish,
              and the same in-house caliber at its heart.
            </p>
          </div>
        </div>

        {/* Filter selector */}
        <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-b border-[var(--hairline)] py-4">
          <span className="eyebrow mr-4">Filter</span>
          {FAMILIES.map((family) => (
            <button
              key={family}
              onClick={() => setFilter(family)}
              className={cn(
                "px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] transition-all duration-300",
                filter === family
                  ? "bg-[var(--text)] text-[var(--bg)]"
                  : "text-[var(--text-soft)] hover:text-[var(--text)]"
              )}
            >
              {family}
            </button>
          ))}
          <span className="ml-auto spec-mono">
            {filtered.length} of {WATCHES.length} pieces
          </span>
        </div>
      </div>

      {/* Grid of watches */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-[var(--hairline)]">
          {filtered.map((watch, i) => (
            <motion.div
              key={watch.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.8,
                delay: (i % 4) * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-[var(--bg)]"
            >
              <WatchCard watch={watch} index={i} />
            </motion.div>
          ))}
        </div>

        {/* Footer note + CTA */}
        <div className="mt-20 grid lg:grid-cols-2 gap-8 items-center pt-12 border-t border-[var(--hairline)]">
          <div>
            <div className="eyebrow mb-3">Private Commissions</div>
            <p className="display-3 text-[var(--text)]">
              Beyond the catalog — bespoke pieces, conceived with you.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <MagneticButton as="a" href="#contact" className="btn-bay">
              <span>Begin a Commission</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 7h8m0 0L7 3m4 4l-4 4"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
