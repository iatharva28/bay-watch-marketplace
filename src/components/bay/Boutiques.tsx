"use client";

import { motion } from "framer-motion";
import { BOUTIQUES } from "@/lib/bay/data";
import MagneticButton from "./MagneticButton";

/**
 * BAY Boutiques — a list of the maison's worldwide
 * boutiques. Each boutique is presented as a row with
 * city, address, country, hours, and an appointment CTA.
 * The list animates row-by-row on scroll into view.
 */
export default function Boutiques() {
  return (
    <section id="boutiques" className="relative py-32 lg:py-48">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        {/* Section opener */}
        <div className="grid lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-8">
              <span className="section-num">07</span>
              <span className="w-12 h-px bg-[var(--hairline)]" />
              <span className="eyebrow">Boutiques</span>
            </div>
            <h2 className="display-2 text-[var(--text)]">
              Six rooms,
              <br />
              <span className="italic-serif text-[var(--platinum)]">six cities.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-8 flex items-end">
            <p className="body-lg">
              Each BAY boutique is designed as a private salon —
              a place to handle the collection, speak with a
              watchmaker, and consider a piece without pressure.
              Visits are by appointment.
            </p>
          </div>
        </div>

        {/* Boutique list */}
        <div className="border-t border-[var(--hairline)]">
          {BOUTIQUES.map((b, i) => (
            <motion.div
              key={b.city}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.8,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-8 lg:py-10 border-b border-[var(--hairline)] items-baseline hover:bg-[var(--surface-1)] transition-colors duration-500 cursor-pointer"
              data-cursor="hover"
            >
              {/* Index */}
              <div className="md:col-span-1">
                <span className="spec-mono text-[var(--text-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              {/* City */}
              <div className="md:col-span-3">
                <h3 className="font-display text-4xl lg:text-5xl font-light text-[var(--text)] group-hover:text-[var(--platinum)] transition-colors duration-500">
                  {b.city}
                </h3>
              </div>
              {/* Address */}
              <div className="md:col-span-4">
                <div className="font-mono text-xs text-[var(--text-soft)] mb-1">
                  {b.address}
                </div>
                <div className="spec-mono">{b.country}</div>
              </div>
              {/* Hours */}
              <div className="md:col-span-3">
                <div className="spec-mono mb-1">Hours</div>
                <div className="font-mono text-xs text-[var(--text-soft)]">
                  {b.hours}
                </div>
              </div>
              {/* CTA */}
              <div className="md:col-span-1 md:text-right">
                <span className="link-bay md:justify-end">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M3 7h8m0 0L7 3m4 4l-4 4"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA — private appointment */}
        <div className="mt-20 grid lg:grid-cols-2 gap-8 items-center pt-12 border-t border-[var(--hairline)]">
          <div>
            <div className="eyebrow mb-3">Private Appointments</div>
            <p className="display-3 text-[var(--text)]">
              Schedule a private viewing with a BAY advisor.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <MagneticButton as="a" href="#contact" className="btn-bay btn-bay-solid">
              <span>Request an Appointment</span>
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
