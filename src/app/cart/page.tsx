"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/bay/cart-store";
import { formatInrFull, formatInr, getSellerById } from "@/lib/bay/data";
import WatchFace from "@/components/marketplace/WatchFace";
import SellerBadge from "@/components/marketplace/SellerBadge";
import { ScrollReveal } from "@/components/bay/ScrollReveal";
import { cn } from "@/lib/utils";

/**
 * BAY /cart — the full-page cart.
 *
 * Distinct from the CartDrawer (which is a quick-add slide-out):
 * this page shows the full cart with editable quantities, per-item
 * seller info, GST/TCS breakdown, and a clear checkout CTA.
 */
export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    gstAmount,
    tcsAmount,
    total,
    clear,
  } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <div className="w-24 h-24 rounded-full border border-[var(--hairline)] flex items-center justify-center mx-auto mb-8">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M12 15h16l-2 18H14L12 15z"
              stroke="var(--text-muted)"
              strokeWidth="1"
            />
            <path
              d="M16 15V10a4 4 0 018 0v5"
              stroke="var(--text-muted)"
              strokeWidth="1"
            />
          </svg>
        </div>
        <ScrollReveal>
          <div className="eyebrow mb-4">Your Selection</div>
          <h1 className="display-2 text-[var(--text)] mb-4">
            Your cart is <span className="italic-serif text-[var(--platinum)]">empty</span>
          </h1>
          <p className="body-lg max-w-md mx-auto mb-10">
            Discover the collection — each piece is a study in restraint,
            each seller vetted by BAY.
          </p>
          <Link href="/shop" className="btn-bay btn-bay-solid">
            <span>Explore the Collection</span>
          </Link>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-6">
          <span className="section-num">/cart</span>
          <span className="w-12 h-px bg-[var(--hairline)]" />
          <span className="eyebrow">Your Selection</span>
        </div>
        <h1 className="display-2 text-[var(--text)] mb-12">
          Your <span className="italic-serif text-[var(--platinum)]">cart</span>
        </h1>
      </ScrollReveal>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--hairline)]">
            <span className="eyebrow">
              {items.length} {items.length === 1 ? "piece" : "pieces"}
            </span>
            <button
              onClick={clear}
              className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--platinum)] transition-colors"
            >
              Clear Cart
            </button>
          </div>

          <ul className="divide-y divide-[var(--hairline)]">
            {items.map((item, i) => {
              const seller = getSellerById(item.sellerId);
              return (
                <motion.li
                  key={item.productId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="py-8 flex gap-6"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/product/${item.slug}`}
                    className="shrink-0 w-32 h-32 surface flex items-center justify-center"
                  >
                    <WatchFace
                      dialColor={item.dialColor}
                      caseFinish={item.caseFinish}
                      complicationType={item.complicationType}
                      size={96}
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-display text-2xl font-light hover:text-[var(--platinum)] transition-colors"
                        >
                          {item.name}
                        </Link>
                        <div className="spec-mono mt-1">{item.ref}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-[var(--text)]">
                          {formatInrFull(item.priceInr * item.quantity)}
                        </div>
                        <div className="spec-mono mt-1">
                          {formatInr(item.priceInr)} each
                        </div>
                      </div>
                    </div>

                    {/* Seller */}
                    <div className="flex items-center gap-2 mb-4">
                      {seller && <SellerBadge type={seller.type} />}
                      <span className="spec-mono">{item.sellerName}</span>
                    </div>

                    {/* Quantity + remove */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-[var(--hairline-strong)]">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
                            <path d="M0 1h10" stroke="currentColor" strokeWidth="1" />
                          </svg>
                        </button>
                        <span className="w-10 text-center font-mono text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M0 5h10M5 0v10" stroke="currentColor" strokeWidth="1" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--platinum)] transition-colors"
                      >
                        Remove
                      </button>
                      <span className="spec-mono ml-auto">
                        Ships in {item.shipsInDays}d
                      </span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>

          <div className="mt-8 pt-8 border-t border-[var(--hairline)] flex justify-between">
            <Link
              href="/shop"
              className="link-bay"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 6H3m0 0l3 3M3 6l3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="surface-elevated p-8">
            <div className="eyebrow-platinum mb-6">Order Summary</div>

            <dl className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--text-soft)]">
                  Subtotal ({items.length} {items.length === 1 ? "piece" : "pieces"})
                </dt>
                <dd className="font-mono text-[var(--text)]">
                  {formatInrFull(subtotal())}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--text-soft)]">of which GST (18%)</dt>
                <dd className="font-mono text-[var(--text-muted)]">
                  {formatInrFull(gstAmount())}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--text-soft)]">TCS (1%)</dt>
                <dd className="font-mono text-[var(--text-muted)]">
                  {formatInrFull(tcsAmount())}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[var(--text-soft)]">Shipping</dt>
                <dd className="font-mono text-[var(--platinum)]">Free</dd>
              </div>
            </dl>

            <div className="h-px bg-[var(--hairline)] my-6" />

            <div className="flex justify-between items-baseline mb-8">
              <span className="font-display text-lg">Total</span>
              <span className="font-display text-3xl font-light text-[var(--text)]">
                {formatInr(total())}
              </span>
            </div>

            <Link
              href="/checkout"
              className="btn-bay btn-bay-solid w-full justify-center"
            >
              <span>Proceed to Checkout</span>
            </Link>

            <div className="mt-6 pt-6 border-t border-[var(--hairline)] space-y-2">
              <div className="flex items-center gap-2 spec-mono">
                <span className="w-1 h-1 rounded-full bg-[var(--platinum)]" />
                GST inclusive pricing
              </div>
              <div className="flex items-center gap-2 spec-mono">
                <span className="w-1 h-1 rounded-full bg-[var(--platinum)]" />
                TCS remitted by BAY
              </div>
              <div className="flex items-center gap-2 spec-mono">
                <span className="w-1 h-1 rounded-full bg-[var(--platinum)]" />
                Insured shipping across India
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
