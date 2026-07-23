"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CRAFT_PILLARS } from "@/lib/bay/data";

/**
 * BAY Craftsmanship — four pillars of the maison's making,
 * presented as a sticky-scrolling editorial. The left column
 * holds the section heading while the right column flows
 * through each pillar with a parallax stat block.
 */
export default function Craftsmanship() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const headerY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <section
      ref={ref}
      id="craftsmanship"
      className="relative bg-[var(--bg-soft)] py-32 lg:py-48"
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        {/* Section opener */}
        <div className="grid lg:grid-cols-12 gap-8 mb-32">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <span className="section-num">02</span>
              <span className="w-12 h-px bg-[var(--hairline)]" />
              <span className="eyebrow">Craftsmanship</span>
            </div>
            <h2 className="display-2 text-[var(--text)]">
              Made by hand.
              <br />
              <span className="italic-serif text-[var(--platinum)]">
                Made to last.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8 flex items-end">
            <p className="body-lg">
              A BAY passes through four ateliers before it leaves
              Le Crêt-du-Locle. Each is staffed by specialists who
              do one thing — and do it for decades.
            </p>
          </div>
        </div>

        {/* Sticky-scrolling pillars */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sticky left header */}
          <div className="lg:col-span-4">
            <motion.div
              style={{ y: headerY }}
              className="lg:sticky lg:top-32 space-y-6"
            >
              <div className="aspect-square surface-elevated relative overflow-hidden">
                {/* Decorative — concentric rings like a dial face */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-[90%] aspect-square rounded-full border border-[var(--hairline)] slow-rotate" />
                  <div className="absolute w-[70%] aspect-square rounded-full border border-dashed border-[var(--hairline-strong)] slow-rotate" style={{ animationDirection: "reverse" }} />
                  <div className="absolute w-[50%] aspect-square rounded-full border border-[var(--hairline)]" />
                  <div className="relative text-center">
                    <div className="font-display text-7xl font-light text-[var(--platinum)]">
                      4
                    </div>
                    <div className="eyebrow mt-2">Ateliers</div>
                  </div>
                </div>
              </div>
              <p className="body-md">
                Movement, case, dial, and assembly — each pillar
                is a discipline, a workshop, and a master.
              </p>
            </motion.div>
          </div>

          {/* Flowing right column — pillars */}
          <div className="lg:col-span-8 lg:pl-8 space-y-32">
            {CRAFT_PILLARS.map((pillar, i) => (
              <Pillar key={pillar.num} pillar={pillar} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pillar({
  pillar,
  index,
}: {
  pillar: (typeof CRAFT_PILLARS)[number];
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
    >
      {/* Number */}
      <div className="md:col-span-2">
        <div className="font-display text-6xl font-light text-[var(--platinum)]">
          {pillar.num}
        </div>
      </div>

      {/* Content */}
      <div className="md:col-span-7">
        <div className="eyebrow mb-3">{pillar.title}</div>
        <h3 className="display-3 text-[var(--text)] mb-6 leading-tight">
          {pillar.headline}
        </h3>
        <p className="body-lg max-w-md">{pillar.body}</p>
      </div>

      {/* Stat */}
      <div className="md:col-span-3 md:pl-4 md:border-l md:border-[var(--hairline)]">
        <div className="font-display text-6xl font-light text-[var(--text)] leading-none">
          {pillar.stat}
        </div>
        <div className="eyebrow mt-3">{pillar.statLabel}</div>
      </div>
    </motion.article>
  );
}
