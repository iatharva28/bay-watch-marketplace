"use client";

import { motion } from "framer-motion";
import { JOURNAL_ENTRIES } from "@/lib/bay/data";
import MagneticButton from "./MagneticButton";

/**
 * BAY Journal — editorial preview cards for the maison's
 * long-form content. Each card reveals category, date, title,
 * excerpt, and read time. The first card is rendered larger
 * to anchor the layout with editorial weight.
 */
export default function Journal() {
  const [feature, ...rest] = JOURNAL_ENTRIES;

  return (
    <section id="journal" className="relative py-32 lg:py-48 bg-[var(--bg-soft)]">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        {/* Section opener */}
        <div className="grid lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <span className="section-num">04</span>
              <span className="w-12 h-px bg-[var(--hairline)]" />
              <span className="eyebrow">Journal</span>
            </div>
            <h2 className="display-2 text-[var(--text)]">
              From the bench,
              <br />
              <span className="italic-serif text-[var(--platinum)]">to the page.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8 flex items-end">
            <p className="body-lg">
              Long-form essays on craft, engineering, and the
              quiet decisions that define a watchmaking maison.
            </p>
          </div>
        </div>

        {/* Feature card */}
        <motion.article
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="grid lg:grid-cols-2 gap-8 lg:gap-16 mb-24 surface-elevated p-8 lg:p-12 group cursor-pointer"
          data-cursor="hover"
        >
          {/* Left — visual */}
          <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-3)]">
            <div className="aurora-wash" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-[60%] aspect-square">
                {/* Decorative — text-like grid pattern */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <line
                    key={i}
                    x1="20"
                    y1={20 + i * 14}
                    x2={i % 3 === 0 ? 160 : 120}
                    y2={20 + i * 14}
                    stroke={i % 3 === 0 ? "#C8CCD3" : "#3F4248"}
                    strokeWidth={i % 3 === 0 ? "1" : "0.5"}
                  />
                ))}
              </svg>
            </div>
            <div className="absolute top-6 left-6">
              <span className="eyebrow-platinum">Featured</span>
            </div>
          </div>

          {/* Right — content */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--platinum)]">
                {feature.category}
              </span>
              <span className="w-8 h-px bg-[var(--hairline)]" />
              <span className="spec-mono">{feature.date}</span>
              <span className="w-8 h-px bg-[var(--hairline)]" />
              <span className="spec-mono">{feature.readTime}</span>
            </div>
            <h3 className="display-3 text-[var(--text)] mb-6 leading-tight">
              {feature.title}
            </h3>
            <p className="body-lg mb-8">{feature.excerpt}</p>
            <MagneticButton as="a" href="#journal" className="btn-bay">
              <span>Read the essay</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
        </motion.article>

        {/* Remaining cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {rest.map((entry, i) => (
            <motion.article
              key={entry.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group cursor-pointer surface p-6 lg:p-8 hover:border-[var(--hairline-strong)] transition-colors duration-500"
              data-cursor="hover"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--platinum)]">
                  {entry.category}
                </span>
                <span className="w-6 h-px bg-[var(--hairline)]" />
                <span className="spec-mono">{entry.date}</span>
              </div>
              <h4 className="font-display text-2xl lg:text-3xl font-light text-[var(--text)] mb-4 leading-tight group-hover:text-[var(--platinum)] transition-colors duration-500">
                {entry.title}
              </h4>
              <p className="body-md mb-6">{entry.excerpt}</p>
              <div className="flex items-center justify-between pt-4 border-t border-[var(--hairline)]">
                <span className="spec-mono">{entry.readTime}</span>
                <span className="link-bay">
                  Read
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
