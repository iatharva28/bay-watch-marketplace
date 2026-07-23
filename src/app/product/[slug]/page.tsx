"use client";

import { useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getProductBySlug,
  getSellerById,
  getCategoryById,
  getProductsBySeller,
  formatInr,
  formatInrFull,
  calculateGST,
  calculateTCS,
  PRODUCTS,
  type MarketplaceProduct,
} from "@/lib/bay/data";
import { useCartStore } from "@/lib/bay/cart-store";
import WatchFace from "@/components/marketplace/WatchFace";
import SellerBadge from "@/components/marketplace/SellerBadge";
import ProductCard from "@/components/marketplace/ProductCard";
import { ScrollReveal } from "@/components/bay/ScrollReveal";
import { cn } from "@/lib/utils";

/**
 * BAY /product/[slug] — the product detail page.
 *
 * Layout: split-screen — large watch face on the left (with
 * rotating halo + concentric rings for visual richness),
 * editorial copy + specs + price + add-to-cart on the right.
 * Below: seller info, related pieces from the same seller,
 * and reviews.
 */

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "seller" | "reviews">("specs");

  // Hooks must be called unconditionally — before any early return.
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  // Unwrap params Promise (Next.js 16)
  useMemo(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const product = slug ? getProductBySlug(slug) : undefined;

  if (!product) {
    if (slug === null) return null; // still resolving
    notFound();
  }

  const seller = getSellerById(product.sellerId);
  const category = getCategoryById(product.categoryId);
  const sellerProducts = getProductsBySeller(product.sellerId).filter(
    (p) => p.id !== product.id
  );
  const relatedProducts = PRODUCTS.filter(
    (p) => p.id !== product.id && p.categoryId === product.categoryId
  ).slice(0, 3);

  const gst = calculateGST(product.priceInr * quantity);
  const tcs = calculateTCS(product.priceInr * quantity);
  const total = product.priceInr * quantity + tcs;

  const canAddToCart =
    product.status !== "out_of_stock" && product.status !== "preorder";

  const stockLabel =
    product.status === "out_of_stock"
      ? "Out of Stock"
      : product.status === "preorder"
        ? "Pre-Order — Ships in 30 days"
        : product.status === "low_stock"
          ? `Only ${product.stock} pieces remaining`
          : "In Stock";

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-[var(--hairline)]">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-4 flex items-center gap-2 spec-mono">
          <Link href="/shop" className="hover:text-[var(--platinum)] transition-colors">
            Shop
          </Link>
          <span className="text-[var(--text-faint)]">/</span>
          <span className="text-[var(--text-muted)]">{category?.name ?? product.family}</span>
          <span className="text-[var(--text-faint)]">/</span>
          <span className="text-[var(--text)]">{product.name}</span>
        </div>
      </div>

      {/* Main — split layout */}
      <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left — watch face */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-28"
          >
            <div className="relative aspect-square surface-elevated overflow-hidden">
              <div className="aurora-wash" />
              {/* Concentric guide rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-[90%] aspect-square rounded-full border border-[var(--hairline)] slow-rotate" />
                <div
                  className="absolute w-[75%] aspect-square rounded-full border border-dashed border-[var(--hairline)] slow-rotate"
                  style={{ animationDirection: "reverse", animationDuration: "90s" }}
                />
                <div className="absolute w-[55%] aspect-square rounded-full border border-[var(--hairline)]" />
              </div>

              {/* Tick markers — outer dial */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] opacity-30">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const angle = (i * 6 - 90) * (Math.PI / 180);
                    const isCardinal = i % 5 === 0;
                    const r1 = isCardinal ? 92 : 94;
                    const r2 = 96;
                    return (
                      <line
                        key={i}
                        x1={(100 + Math.cos(angle) * r1).toFixed(4)}
                        y1={(100 + Math.sin(angle) * r1).toFixed(4)}
                        x2={(100 + Math.cos(angle) * r2).toFixed(4)}
                        y2={(100 + Math.sin(angle) * r2).toFixed(4)}
                        stroke={isCardinal ? "#C8CCD3" : "#3F4248"}
                        strokeWidth={isCardinal ? 0.6 : 0.3}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Watch face */}
              <div className="absolute inset-0 flex items-center justify-center">
                <WatchFace
                  dialColor={product.dialColor}
                  caseFinish={product.caseFinish}
                  complicationType={product.complicationType}
                  size={400}
                />
              </div>

              {/* Reference number top-left */}
              <div className="absolute top-6 left-6">
                <div className="spec-mono mb-1">Reference</div>
                <div className="font-mono text-sm text-[var(--text)]">{product.ref}</div>
              </div>

              {/* Production number top-right */}
              <div className="absolute top-6 right-6 text-right">
                <div className="spec-mono mb-1">Production</div>
                <div className="font-mono text-sm text-[var(--platinum)]">
                  {product.production}
                </div>
              </div>

              {/* Limited edition badge */}
              {product.limited && (
                <div className="absolute bottom-6 left-6">
                  <div className="eyebrow-platinum">
                    Limited Edition · {product.production}
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail strip — for future gallery */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "aspect-square surface flex items-center justify-center cursor-pointer transition-colors",
                    i === 0 ? "border-[var(--platinum)]" : "hover:border-[var(--hairline-strong)]"
                  )}
                >
                  <WatchFace
                    dialColor={product.dialColor}
                    caseFinish={product.caseFinish}
                    complicationType={product.complicationType}
                    size={56}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — details */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Seller badge */}
            {seller && (
              <div className="mb-6">
                <SellerBadge type={seller.type} size="md" />
              </div>
            )}

            {/* Name + family */}
            <div className="flex items-baseline gap-3 mb-3">
              <h1 className="display-2 text-[var(--text)] leading-none">
                {product.name}
              </h1>
              <span className="spec-mono">{product.caseDiameter}</span>
            </div>

            {/* Tagline */}
            <p className="italic-serif text-xl text-[var(--platinum)] mb-6">
              {product.tagline}
            </p>

            {/* Full description */}
            <p className="body-lg mb-8">{product.fullDescription}</p>

            {/* Price */}
            <div className="surface-elevated p-6 mb-8">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="spec-mono mb-1">Price (incl. GST 18%)</div>
                  <div className="font-display text-4xl font-light text-[var(--text)]">
                    {formatInr(product.priceInr)}
                  </div>
                  {product.mrpInr && product.mrpInr > product.priceInr && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="spec-mono line-through text-[var(--text-faint)]">
                        {formatInr(product.mrpInr)}
                      </span>
                      <span className="spec-mono text-[var(--platinum)]">
                        Save {formatInr(product.mrpInr - product.priceInr)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="spec-mono mb-1">Stock</div>
                  <div
                    className={cn(
                      "font-mono text-sm",
                      product.status === "low_stock"
                        ? "text-[var(--platinum)]"
                        : "text-[var(--text-soft)]"
                    )}
                  >
                    {stockLabel}
                  </div>
                </div>
              </div>

              {/* Quantity selector */}
              {canAddToCart && (
                <div className="flex items-center gap-4 mb-4">
                  <span className="spec-mono">Quantity</span>
                  <div className="flex items-center border border-[var(--hairline-strong)]">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                        <path d="M0 1h12" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </button>
                    <span className="w-12 text-center font-mono">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
                      aria-label="Increase quantity"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M0 6h12M6 0v12" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </button>
                  </div>
                  <span className="spec-mono text-[var(--text-muted)]">
                    Max {product.stock} per order
                  </span>
                </div>
              )}

              {/* Add to cart */}
              <button
                onClick={() => {
                  if (seller && canAddToCart) {
                    addItem(product, seller.name, seller.type);
                    openCart();
                  }
                }}
                disabled={!canAddToCart}
                className={cn(
                  "btn-bay btn-bay-solid w-full justify-center",
                  !canAddToCart && "opacity-40 cursor-not-allowed"
                )}
              >
                <span>
                  {canAddToCart
                    ? `Add to Cart — ${formatInr(total)}`
                    : "Notify Me When Available"}
                </span>
              </button>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--hairline)]">
                <div>
                  <div className="spec-mono mb-1">Warranty</div>
                  <div className="font-mono text-xs text-[var(--text-soft)]">
                    {product.warrantyMonths} months
                  </div>
                </div>
                <div>
                  <div className="spec-mono mb-1">Ships in</div>
                  <div className="font-mono text-xs text-[var(--text-soft)]">
                    {product.shipsInDays} days
                  </div>
                </div>
                <div>
                  <div className="spec-mono mb-1">Shipping</div>
                  <div className="font-mono text-xs text-[var(--platinum)]">Free</div>
                </div>
              </div>
            </div>

            {/* Tabs — specs / seller / reviews */}
            <div className="border-t border-[var(--hairline)]">
              <div className="flex gap-8 -mb-px">
                {([
                  { id: "specs", label: "Specifications" },
                  { id: "seller", label: `Seller${seller ? ` · ${seller.name}` : ""}` },
                  { id: "reviews", label: `Reviews${product.reviews.length > 0 ? ` · ${product.reviews.length}` : ""}` },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "py-4 text-xs font-mono uppercase tracking-[0.18em] border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-[var(--platinum)] text-[var(--text)]"
                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-soft)]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="py-8">
                {activeTab === "specs" && (
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {[
                      { label: "Complication", value: product.complication },
                      { label: "Movement", value: product.movement },
                      { label: "Case Material", value: product.caseMaterial },
                      { label: "Case Diameter", value: product.caseDiameter },
                      { label: "Water Resistance", value: product.waterResistance },
                      { label: "Power Reserve", value: product.powerReserve },
                      { label: "Production", value: product.production },
                      { label: "Year", value: String(product.year) },
                      { label: "Warranty", value: `${product.warrantyMonths} months` },
                      { label: "Ships in", value: `${product.shipsInDays} days` },
                    ].map((spec) => (
                      <div key={spec.label}>
                        <dt className="spec-mono mb-1">{spec.label}</dt>
                        <dd className="font-mono text-sm text-[var(--text)]">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {activeTab === "seller" && seller && (
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-display text-3xl font-light mb-2">
                          {seller.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <SellerBadge type={seller.type} />
                          {seller.city && (
                            <span className="spec-mono">{seller.city}</span>
                          )}
                          {seller.established && (
                            <span className="spec-mono">
                              Est. {seller.established}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-3xl font-light text-[var(--platinum)]">
                          {seller.rating}
                        </div>
                        <div className="spec-mono">
                          {seller.reviewCount} reviews
                        </div>
                      </div>
                    </div>
                    <p className="body-lg mb-6">{seller.story}</p>
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[var(--hairline)]">
                      <div>
                        <div className="spec-mono mb-1">Specialty</div>
                        <div className="font-mono text-sm text-[var(--text)]">
                          {seller.specialty}
                        </div>
                      </div>
                      <div>
                        <div className="spec-mono mb-1">Commission to BAY</div>
                        <div className="font-mono text-sm text-[var(--text-muted)]">
                          {seller.commissionRate}% on this sale
                        </div>
                      </div>
                    </div>
                    {sellerProducts.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-[var(--hairline)]">
                        <div className="eyebrow mb-4">
                          Other pieces from {seller.name}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {sellerProducts.slice(0, 4).map((p) => (
                            <Link
                              key={p.id}
                              href={`/product/${p.slug}`}
                              className="group flex items-center gap-3 p-3 surface hover:border-[var(--hairline-strong)] transition-colors"
                            >
                              <div className="w-12 h-12 shrink-0">
                                <WatchFace
                                  dialColor={p.dialColor}
                                  caseFinish={p.caseFinish}
                                  complicationType={p.complicationType}
                                  size={48}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-display text-lg font-light truncate group-hover:text-[var(--platinum)] transition-colors">
                                  {p.name}
                                </div>
                                <div className="spec-mono">{formatInr(p.priceInr)}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div>
                    {product.reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="body-md text-[var(--text-muted)] mb-4">
                          No reviews yet. Be the first to share your experience.
                        </p>
                        <button className="btn-bay">
                          <span>Write a Review</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-8 mb-8 pb-8 border-b border-[var(--hairline)]">
                          <div>
                            <div className="font-display text-5xl font-light text-[var(--platinum)]">
                              {(
                                product.reviews.reduce((s, r) => s + r.rating, 0) /
                                product.reviews.length
                              ).toFixed(1)}
                            </div>
                            <div className="spec-mono mt-1">
                              {product.reviews.length} reviews
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count = product.reviews.filter(
                                (r) => r.rating === star
                              ).length;
                              const pct = (count / product.reviews.length) * 100;
                              return (
                                <div key={star} className="flex items-center gap-2">
                                  <span className="spec-mono w-4">{star}</span>
                                  <div className="flex-1 h-1 bg-[var(--surface-2)]">
                                    <div
                                      className="h-full bg-[var(--platinum)]"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="spec-mono w-6 text-right">
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <ul className="space-y-8">
                          {product.reviews.map((review) => (
                            <li
                              key={review.id}
                              className="pb-8 border-b border-[var(--hairline)] last:border-0"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-display text-lg">
                                      {review.author}
                                    </span>
                                    {review.verified && (
                                      <span className="spec-mono text-[var(--platinum)]">
                                        Verified Buyer
                                      </span>
                                    )}
                                  </div>
                                  <div className="spec-mono">{review.date}</div>
                                </div>
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={
                                        i < review.rating
                                          ? "text-[var(--platinum)]"
                                          : "text-[var(--text-faint)]"
                                      }
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <h4 className="font-display text-xl font-light mb-2">
                                {review.title}
                              </h4>
                              <p className="body-md">{review.body}</p>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related pieces */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[var(--hairline)] py-20">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8">
                <span className="section-num">/related</span>
                <span className="w-12 h-px bg-[var(--hairline)]" />
                <span className="eyebrow">More in {category?.name}</span>
              </div>
              <h2 className="display-3 text-[var(--text)] mb-12">
                You may also <span className="italic-serif text-[var(--platinum)]">consider</span>
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedProducts.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  seller={getSellerById(p.sellerId)}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
