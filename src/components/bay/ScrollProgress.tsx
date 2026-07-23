"use client";

import { useEffect, useState } from "react";

/**
 * BAY ScrollProgress — a thin platinum line at the top of the
 * viewport that fills as the user scrolls. A small label shows
 * the current section name. Provides a persistent sense of
 * position within the long-form experience.
 */
export default function ScrollProgress({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  const [progress, setProgress] = useState(0);
  const [activeLabel, setActiveLabel] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const p = total > 0 ? window.scrollY / total : 0;
      setProgress(p);

      // Determine which section is currently in view
      let active = sections[0]?.label ?? "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.5) {
          active = s.label;
        }
      }
      setActiveLabel(active);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  return (
    <>
      {/* Top progress line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none">
        <div
          className="h-full bg-[var(--platinum)] origin-left"
          style={{
            transform: `scaleX(${progress})`,
            transition: "transform 0.1s linear",
          }}
        />
      </div>
      {/* Section label, fixed bottom-left */}
      <div className="fixed bottom-6 left-6 z-40 pointer-events-none hidden md:block">
        <div className="eyebrow-platinum mb-1">Section</div>
        <div
          className="font-display text-2xl font-light text-[var(--text)]"
          style={{ fontFeatureSettings: "'tnum'" }}
        >
          {activeLabel}
        </div>
      </div>
    </>
  );
}
