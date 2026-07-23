"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { memo, useState } from "react";
import { useSession } from "next-auth/react";
import type { MarketplaceProduct, Seller } from "@/lib/bay/data";
import { formatInr } from "@/lib/bay/data";
import { useCartStore } from "@/lib/bay/cart-store";
import WatchFace from "./WatchFace";
import SellerBadge from "./SellerBadge";
import { cn } from "@/lib/utils";

/**
 * BAY ProductCard — the marketplace browse card.
 * Distinct from the marketing WatchCard:
 *   · Smaller, denser layout (4-col grid friendly)
 *   · Seller badge + price + stock status always visible
 *   · "Add to Cart" button (wired to cart store)
 *   · Links to /product/[slug]
 *
 * Keeps the Glacier Noir visual language: same surface, same
 * hairlines, same hover halo, same delight moments on the dial.
 */
function ProductCardInner({
  product,
  seller,
  index = 0,
}: {
  product: MarketplaceProduct;
  seller: Seller | undefined;
  index?: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const stockLabel =
    product.status === "out_of_stock"
      ? "Out of Stock"
      : product.status === "preorder"
        ? "Pre-Order"
        : product.status === "low_stock"
          ? `Only ${product.stock} left`
          : "In Stock";

  const stockColor =
    product.status === "out_of_stock"
      ? "text-[var(--text-faint)]"
      : product.status === "low_stock" || product.status === "preorder"
        ? "text-[var(--platinum)]"
        : "text-[var(--text-muted)]";

  const canAddToCart = product.status !== "out_of_stock" && product.status !== "preorder";

  const handleAddToCart = async () => {
    if (!seller) return;

    // Check auth — if not logged in, redirect to login (no hard reload)
    if (status === "unauthenticated") {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}&reason=${encodeURIComponent("Sign in to add items to your cart.")}`
      );
      return;
    }

    if (status === "loading" || adding) return;

    setAdding(true);

    // Optimistic update — update the local cart immediately for instant feedback
    addItem(product, seller.name, seller.type);

    // Sync to database (fire-and-forget — if it fails, the local cart
    // still works; the next page load will re-sync from the server)
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });
    } catch {
      // Network error — local cart is still updated, user can retry
    } finally {
      setAdding(false);
      openCart();
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="watch-card group relative flex flex-col"
      data-cursor="hover"
    >
      {/* Top row — ref + seller badge */}
      <div className="flex items-start justify-between p-5 pb-0">
        <div className="flex flex-col gap-1">
          <span className="spec-mono">{product.ref}</span>
          {product.limited && (
            <span className="eyebrow-platinum">{product.production}</span>
          )}
        </div>
        {seller && <SellerBadge type={seller.type} />}
      </div>

      {/* Watch face — center */}
      <Link
        href={`/product/${product.slug}`}
        className="block flex-1 flex items-center justify-center p-6"
        aria-label={`View ${product.name}`}
      >
        <div className="relative w-full aspect-square max-w-[220px]">
          <div
            className="absolute inset-0 rounded-full opacity-40 blur-2xl transition-opacity duration-700 group-hover:opacity-80"
            style={{
              background:
                "radial-gradient(circle, rgba(200,204,211,0.18) 0%, transparent 70%)",
            }}
          />
          <div className="relative transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]">
            <WatchFace
              dialColor={product.dialColor}
              caseFinish={product.caseFinish}
              complicationType={product.complicationType}
              size={220}
              className="w-full h-full"
            />
          </div>
        </div>
      </Link>

      {/* Bottom — name, tagline, price, add to cart */}
      <div className="p-5 pt-0">
        <div className="flex items-baseline gap-2 mb-1">
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-display text-2xl font-light leading-none hover:text-[var(--platinum)] transition-colors">
              {product.name}
            </h3>
          </Link>
          <span className="spec-mono">{product.caseDiameter}</span>
        </div>
        <p className="body-md text-[var(--text-soft)] line-clamp-1 mb-3">
          {product.tagline}
        </p>

        {/* Stock status */}
        <div className="flex items-center gap-2 mb-4">
          <span className={cn("spec-mono", stockColor)}>{stockLabel}</span>
          <span className="w-1 h-1 rounded-full bg-[var(--text-faint)]" />
          <span className="spec-mono">Ships in {product.shipsInDays}d</span>
        </div>

        {/* Price + Add to Cart */}
        <div className="flex items-end justify-between gap-3 pt-4 border-t border-[var(--hairline)]">
          <div>
            <div className="spec-mono mb-1">Price (incl. GST)</div>
            <div className="font-display text-2xl font-light text-[var(--text)]">
              {formatInr(product.priceInr)}
            </div>
            {product.mrpInr && product.mrpInr > product.priceInr && (
              <div className="spec-mono line-through text-[var(--text-faint)] mt-0.5">
                {formatInr(product.mrpInr)}
              </div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart || adding}
            className={cn(
              "btn-bay !px-4 !py-2.5 !text-[10px]",
              !canAddToCart && "opacity-40 cursor-not-allowed hover:!text-[var(--text)] hover:!border-[var(--hairline-strong)]"
            )}
            aria-label={`Add ${product.name} to cart`}
          >
            <span>{adding ? "Adding..." : canAddToCart ? "Add to Cart" : "Notify Me"}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * Memoized export - prevents re-render of all 12 cards when one
 * card updates the cart store. Only the affected card re-renders.
 */
export default memo(ProductCardInner);
