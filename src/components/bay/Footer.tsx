"use client";

import { motion } from "framer-motion";
import { NAV_LINKS } from "@/lib/bay/data";

/**
 * BAY Footer — the closing chapter. Includes a final brand
 * statement, the maison's contact, the full navigation, legal
 * links, and a thin closing line. The footer is treated as a
 * destination, not an afterthought — large display type and
 * generous whitespace frame the brand wordmark one last time.
 */
export default function Footer() {
  return (
    <footer id="contact" className="relative bg-[var(--bg-soft)] border-t border-[var(--hairline)] pt-32 pb-12 overflow-hidden">
      <div className="aurora-wash" />

      <div className="relative max-w-[1600px] mx-auto px-6 lg:px-10">
        {/* Top — closing statement + contact */}
        <div className="grid lg:grid-cols-12 gap-12 mb-32">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="eyebrow mb-6">Begin a Conversation</div>
              <h2 className="display-1 text-[var(--text)] leading-[0.95]">
                Become part
                <br />
                of the
                <br />
                <span className="italic-serif text-[var(--platinum)]">
                  maison.
                </span>
              </h2>
            </motion.div>
          </div>

          <div className="lg:col-span-5 lg:pl-8 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="body-lg mb-8">
                For orders, servicing, or a conversation about a
                piece in the collection, our team is at your service.
              </p>
              <div className="space-y-2">
                <a
                  href="mailto:care@baymaison.in"
                  className="block font-display text-2xl text-[var(--text)] hover:text-[var(--platinum)] transition-colors"
                >
                  care@baymaison.in
                </a>
                <a
                  href="tel:+912266001234"
                  className="block font-mono text-sm text-[var(--text-soft)] hover:text-[var(--platinum)] transition-colors"
                >
                  +91 22 6600 1234
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Middle — large wordmark */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-b border-[var(--hairline)] py-12 lg:py-16 mb-16"
        >
          <div className="text-center">
            <div className="font-display text-[18vw] lg:text-[16rem] font-light leading-none tracking-[0.05em] text-[var(--text)]">
              BAY
            </div>
            <div className="eyebrow mt-4">
              Maison Horlogère · Mumbai · India
            </div>
          </div>
        </motion.div>

        {/* Bottom — nav + legal */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-12">
          {/* Nav */}
          <div className="col-span-2 md:col-span-5">
            <div className="eyebrow mb-4">Navigate</div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Maison */}
          <div className="md:col-span-3">
            <div className="eyebrow mb-4">Maison</div>
            <ul className="space-y-2">
              <li>
                <a href="/#top" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  The House of BAY
                </a>
              </li>
              <li>
                <a href="/#movements" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Calibers
                </a>
              </li>
              <li>
                <a href="/#journal" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Journal
                </a>
              </li>
              <li>
                <a href="/#limited" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Limited Editions
                </a>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="md:col-span-2">
            <div className="eyebrow mb-4">Account</div>
            <ul className="space-y-2">
              <li>
                <a href="/auth/login" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Sign In
                </a>
              </li>
              <li>
                <a href="/auth/register" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Create Account
                </a>
              </li>
              <li>
                <a href="/account" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  My Orders
                </a>
              </li>
              <li>
                <a href="/shop" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Shop
                </a>
              </li>
            </ul>
          </div>

          {/* Sell */}
          <div className="md:col-span-2">
            <div className="eyebrow mb-4">Sell on BAY</div>
            <ul className="space-y-2">
              <li>
                <a href="/seller" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Seller Portal
                </a>
              </li>
              <li>
                <a href="/auth/register" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Apply to Sell
                </a>
              </li>
              <li>
                <a href="/admin" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Admin
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <div className="eyebrow mb-4">Legal</div>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Cookies
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[var(--text-soft)] hover:text-[var(--text)] transition-colors">
                  Imprint
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Final line */}
        <div className="pt-8 border-t border-[var(--hairline)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="spec-mono">
            © 1947–2025 BAY Maison Horlogère SA. All rights reserved.
          </p>
          <p className="spec-mono">
            Designed in Mumbai. Made in Switzerland.
          </p>
        </div>
      </div>
    </footer>
  );
}
