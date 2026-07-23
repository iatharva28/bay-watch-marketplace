"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "./Marquee";
import { MARQUEE_WORDS } from "@/lib/bay/data";

/**
 * BAY Manifesto — a brief philosophy statement that sits
 * between the hero and the collections grid. Includes a
 * marquee band of brand values and a centered editorial
 * statement that reveals word-by-word on scroll.
 */
export default function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} className="relative py-32 lg:py-48 overflow-hidden">
      {/* Marquee band — top */}
      <div className="py-8 border-y border-[var(--hairline)] mb-32">
        <Marquee duration={45}>
          {MARQUEE_WORDS.map((word, i) => (
            <span
              key={i}
              className="inline-flex items-center font-display text-5xl lg:text-7xl font-light italic-serif text-[var(--text-soft)] mx-12"
            >
              {word}
              <span className="ml-12 w-2 h-2 rounded-full bg-[var(--platinum)] inline-block" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* Centered manifesto */}
      <motion.div
        style={{ y }}
        className="max-w-5xl mx-auto px-6 lg:px-10 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="w-12 h-px bg-[var(--platinum)]" />
          <span className="eyebrow-platinum">The BAY Philosophy</span>
          <span className="w-12 h-px bg-[var(--platinum)]" />
        </div>

        <p className="display-2 text-[var(--text)] leading-[1.1]">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            We believe a watch should
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="block italic-serif text-[var(--platinum)]"
          >
            outlast its owner,
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            carry a story forward,
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="block italic-serif text-[var(--platinum)]"
          >
            and never need to shout.
          </motion.span>
        </p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="body-lg max-w-2xl mx-auto mt-16"
        >
          Every BAY is conceived as an heirloom — assembled by a
          single watchmaker, finished by hand, and engineered to
          run for generations without compromise. We do not chase
          trends. We chase precision.
        </motion.p>
      </motion.div>
    </section>
  );
}
