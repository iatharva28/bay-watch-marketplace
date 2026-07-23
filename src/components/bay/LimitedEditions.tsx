"use client";

import { motion } from "framer-motion";
import { WATCHES } from "@/lib/bay/data";
import MagneticButton from "./MagneticButton";

/**
 * BAY LimitedEditions — a focused showcase of the maison's
 * rarest pieces. Six limited editions, presented as large
 * editorial tiles with full-bleed copy and price-on-request
 * for the rarest. This is the "million dollar business" the
 * user asked us to convey.
 */
export default function LimitedEditions() {
  const limited = WATCHES.filter((w) => w.limited);

  return (
    <section id="limited" className="relative py-32 lg:py-48 overflow-hidden">
      {/* Section opener */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 mb-24">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <span className="section-num">03</span>
              <span className="w-12 h-px bg-[var(--hairline)]" />
              <span className="eyebrow">Limited Editions</span>
            </div>
            <h2 className="display-2 text-[var(--text)]">
              Numbered.
              <br />
              <span className="italic-serif text-[var(--platinum)]">Signed.</span>
              <br />
              Irreplaceable.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8 flex items-end">
            <p className="body-lg">
              Five, ten, twenty-five, fifty pieces — never more.
              Each is engraved with its number, signed by its
              maker, and accompanied by its own certificate of
              origin. The maison will not produce beyond the
              stated run.
            </p>
          </div>
        </div>
      </div>

      {/* Featured limited pieces — alternating layout */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 space-y-32">
        {limited.map((watch, i) => (
          <motion.article
            key={watch.id}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={`grid lg:grid-cols-12 gap-8 lg:gap-16 items-center ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            {/* Visual — abstract dial representation */}
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] surface-elevated overflow-hidden group">
                {/* Aurora wash */}
                <div className="aurora-wash" />
                {/* Concentric rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-[80%] aspect-square rounded-full border border-[var(--hairline)] slow-rotate" />
                  <div className="absolute w-[60%] aspect-square rounded-full border border-dashed border-[var(--hairline-strong)] slow-rotate" style={{ animationDirection: "reverse", animationDuration: "80s" }} />
                  <div className="absolute w-[40%] aspect-square rounded-full border border-[var(--hairline)]" />
                </div>

                {/* Production number — large */}
                <div className="absolute top-8 left-8">
                  <div className="eyebrow mb-2">Numbered</div>
                  <div className="font-display text-7xl lg:text-8xl font-light text-[var(--text)] leading-none">
                    {watch.production.replace("Limited ", "")}
                  </div>
                  <div className="eyebrow mt-2 text-[var(--platinum)]">
                    pieces worldwide
                  </div>
                </div>

                {/* Reference + name — bottom right */}
                <div className="absolute bottom-8 right-8 text-right">
                  <div className="spec-mono mb-1">{watch.ref}</div>
                  <div className="font-display text-4xl lg:text-5xl font-light">
                    {watch.name}
                  </div>
                </div>

                {/* Center complication icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-32 h-32 rounded-full border border-[var(--platinum)] opacity-30 flex items-center justify-center">
                    <span className="font-mono text-xs uppercase tracking-widest text-[var(--platinum)]">
                      {watch.complicationType.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial copy */}
            <div className="lg:col-span-5">
              <div className="eyebrow-platinum mb-4">{watch.family}</div>
              <h3 className="display-3 text-[var(--text)] mb-6 leading-tight">
                {watch.tagline}
              </h3>
              <p className="body-lg mb-8">{watch.description}</p>

              {/* Spec grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8 py-6 border-t border-b border-[var(--hairline)]">
                <Spec label="Complication" value={watch.complication} />
                <Spec label="Movement" value={watch.movement.split("—")[0].trim()} />
                <Spec label="Case" value={watch.caseMaterial} />
                <Spec label="Diameter" value={watch.caseDiameter} />
              </div>

              {/* Price + CTA */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="spec-mono mb-1">Price</div>
                  <div className="font-display text-3xl text-[var(--text)]">
                    {watch.price}
                  </div>
                </div>
                <MagneticButton as="a" href="#contact" className="btn-bay">
                  <span>Enquire</span>
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
            </div>
          </motion.article>
        ))}
      </div>
    </section>
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
