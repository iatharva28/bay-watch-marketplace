"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCartStore } from "@/lib/bay/cart-store";
import { formatInrFull, formatInr } from "@/lib/bay/data";
import WatchFace from "./WatchFace";
import { useEffect, useRef } from "react";

/**
 * BAY CartDrawer — a slide-out panel from the right.
 * Opens automatically when an item is added.
 * Shows line items, GST breakdown, TCS, and a checkout CTA.
 *
 * Accessibility:
 *   - Focus trap: Tab cycles within the drawer while open
 *   - Escape closes the drawer
 *   - Body scroll locked while open
 *   - aria-modal + role="dialog" for screen readers
 *   - Focus returns to the trigger element on close
 */
export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, gstAmount, tcsAmount, total, itemCount } = useCartStore();
  const drawerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape + focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Save the element that had focus before opening (so we can restore it)
    triggerRef.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
        return;
      }
      // Focus trap — keep Tab within the drawer
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    // Move focus into the drawer on open
    const timer = setTimeout(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
      // Restore focus to the trigger element on close
      triggerRef.current?.focus();
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={closeCart}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            aria-hidden
          />

          {/* Drawer */}
          <motion.aside
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[95] w-full max-w-md bg-[var(--bg)] border-l border-[var(--hairline)] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--hairline)]">
              <div>
                <div className="eyebrow-platinum mb-1">Your Selection</div>
                <h2 className="font-display text-2xl font-light">
                  Cart {itemCount() > 0 && `(${itemCount()})`}
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 -mr-2 hover:text-[var(--platinum)] transition-colors"
                aria-label="Close cart"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full border border-[var(--hairline)] flex items-center justify-center mb-6">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path
                        d="M10 12h12l-1 14H11L10 12z"
                        stroke="var(--text-muted)"
                        strokeWidth="1"
                      />
                      <path
                        d="M13 12V8a3 3 0 016 0v4"
                        stroke="var(--text-muted)"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display text-2xl font-light mb-2">
                    Your cart is empty
                  </h3>
                  <p className="body-md mb-6">
                    Discover the collection — each piece is a study in restraint.
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="btn-bay btn-bay-solid"
                  >
                    <span>Explore the Collection</span>
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--hairline)]">
                  {items.map((item) => (
                    <li key={item.productId} className="p-6 flex gap-4">
                      {/* Thumbnail */}
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="shrink-0 w-20 h-20 surface flex items-center justify-center"
                      >
                        <WatchFace
                          dialColor={item.dialColor}
                          caseFinish={item.caseFinish}
                          complicationType={item.complicationType}
                          size={64}
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h4 className="font-display text-lg font-light leading-tight">
                              {item.name}
                            </h4>
                            <span className="spec-mono">{item.ref}</span>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-[var(--text-muted)] hover:text-[var(--platinum)] transition-colors p-1 -mt-1 -mr-1"
                            aria-label={`Remove ${item.name}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1" />
                            </svg>
                          </button>
                        </div>
                        <p className="spec-mono mb-3">{item.sellerName}</p>

                        <div className="flex items-center justify-between">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-[var(--hairline-strong)]">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
                                <path d="M0 1h10" stroke="currentColor" strokeWidth="1" />
                              </svg>
                            </button>
                            <span className="w-8 text-center font-mono text-xs">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
                              aria-label="Increase quantity"
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M0 5h10M5 0v10" stroke="currentColor" strokeWidth="1" />
                              </svg>
                            </button>
                          </div>
                          <div className="font-mono text-sm text-[var(--text)]">
                            {formatInrFull(item.priceInr * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer — totals + checkout */}
            {items.length > 0 && (
              <div className="border-t border-[var(--hairline)] p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-soft)]">Subtotal (incl. GST 18%)</span>
                  <span className="font-mono text-[var(--text)]">
                    {formatInrFull(subtotal())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-soft)]">
                    of which GST
                  </span>
                  <span className="font-mono text-[var(--text-muted)]">
                    {formatInrFull(gstAmount())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-soft)]">TCS (1%)</span>
                  <span className="font-mono text-[var(--text-muted)]">
                    {formatInrFull(tcsAmount())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-soft)]">Shipping</span>
                  <span className="font-mono text-[var(--platinum)]">Free</span>
                </div>
                <div className="h-px bg-[var(--hairline)] my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-2xl font-light text-[var(--text)]">
                    {formatInr(total())}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn-bay btn-bay-solid w-full justify-center mt-4"
                >
                  <span>Proceed to Checkout</span>
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full text-center text-xs font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-2"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
