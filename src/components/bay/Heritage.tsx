"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HERITAGE_TIMELINE } from "@/lib/bay/data";

/**
 * BAY Heritage — a vertical timeline of the maison's history,
 * with a scroll-driven progress line that fills as the user
 * descends through the decades. Each milestone is a paired
 * editorial block: year on the left, story on the right.
 */
export default function Heritage() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 80%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={ref}
      id="heritage"
      className="relative py-32 lg:py-48"
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        {/* Section opener */}
        <div className="grid lg:grid-cols-12 gap-8 mb-32">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <span className="section-num">03</span>
              <span className="w-12 h-px bg-[var(--hairline)]" />
              <span className="eyebrow">Heritage</span>
            </div>
            <h2 className="display-2 text-[var(--text)]">
              Seventy-eight years
              <br />
              of <span className="italic-serif text-[var(--platinum)]">quiet ambition.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8 flex items-end">
            <p className="body-lg">
              From a single bench in 1947 to a grand complication
              atelier in 2024, BAY has grown without ever raising
              its voice.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical progress rail */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-[var(--hairline)] md:-translate-x-1/2">
            <motion.div
              style={{ scaleY: lineScale }}
              className="absolute top-0 left-0 right-0 bottom-0 bg-[var(--platinum)] origin-top"
            />
          </div>

          <div className="space-y-32 lg:space-y-48">
            {HERITAGE_TIMELINE.map((milestone, i) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className={`relative grid md:grid-cols-2 gap-8 md:gap-16 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Year side */}
                <div
                  className={`md:pr-12 ${
                    i % 2 === 1 ? "md:pl-12 md:pr-0 md:text-left" : "md:text-right"
                  } pl-8 md:pl-0`}
                >
                  {/* Node on the line */}
                  <div
                    className={`absolute top-2 left-0 md:left-1/2 w-3 h-3 rounded-full bg-[var(--platinum)] md:-translate-x-1/2 ring-4 ring-[var(--bg)]`}
                  />
                  <div className="font-display text-6xl lg:text-8xl font-light text-[var(--text)] leading-none">
                    {milestone.year}
                  </div>
                </div>

                {/* Body side */}
                <div className="md:pl-12 pl-8 md:pl-12">
                  <div className="eyebrow mb-3">
                    Milestone · {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="display-3 text-[var(--text)] mb-4 leading-tight">
                    {milestone.title}
                  </h3>
                  <p className="body-lg max-w-md">{milestone.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
