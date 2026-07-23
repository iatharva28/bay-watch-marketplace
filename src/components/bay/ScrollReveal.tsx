"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

/**
 * BAY ScrollReveal — a reusable wrapper that reveals its children
 * with a staggered, considered motion as they scroll into view.
 *
 * Motion language:
 *  · Long durations (0.8s–1.2s) — never snap
 *  · Single easing curve (--ease-lux) for consistency
 *  · Varied reveal directions to avoid the "one prompt eight times" tell
 *  · `viewport={{ once: true }}` — reveal once, don't replay
 *  · Respects prefers-reduced-motion via Framer's built-in support
 */
const EASE = [0.16, 1, 0.3, 1] as const;

type Direction = "up" | "down" | "left" | "right" | "scale" | "blur";

const offsets: Record<Direction, { x?: number; y?: number; scale?: number }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
  scale: { scale: 0.96 },
  blur: {},
};

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 1,
  className,
  as = "div",
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
}) {
  const offset = offsets[direction];
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={{
        opacity: 0,
        ...offset,
        ...(direction === "blur" ? { filter: "blur(12px)" } : {}),
      }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * ScrollRevealStagger — for lists of items that should reveal
 * one after another with a small stagger. Children must be
 * <ScrollRevealItem> components.
 */
export function ScrollRevealStagger({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  className,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
}) {
  const offset = offsets[direction];
  const item: Variants = {
    hidden: {
      opacity: 0,
      ...offset,
      transition: { duration: 0.8, ease: EASE },
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: EASE },
    },
  };

  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
