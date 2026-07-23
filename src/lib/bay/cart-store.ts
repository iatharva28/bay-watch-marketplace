"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketplaceProduct } from "./data";
import { calculateGST, calculateTCS } from "./data";

/**
 * BAY Cart Store
 *
 * Stores cart items in localStorage via zustand persist.
 * Each cart item is keyed by (productId, sellerId) — no strap
 * variants in the marketplace model (those were marketing-only).
 *
 * GST (18%) is inclusive in the displayed product price.
 * TCS (1%) is added at checkout for marketplace compliance.
 * Shipping is free for all BAY orders (luxury convention).
 */

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  ref: string;
  sellerId: string;
  sellerName: string;
  sellerType: "own_brand" | "authorized" | "vendor";
  priceInr: number; // paise, GST-inclusive
  quantity: number;
  shipsInDays: number;
  warrantyMonths: number;
  /** Watch face rendering cues — for the cart thumbnail */
  dialColor: string;
  caseFinish: string;
  complicationType: string;
  limited?: boolean;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: MarketplaceProduct, sellerName: string, sellerType: "own_brand" | "authorized" | "vendor") => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  /** Computed — total item count (sum of quantities) */
  itemCount: () => number;
  /** Computed — subtotal in paise (GST-inclusive) */
  subtotal: () => number;
  /** Computed — GST component in paise */
  gstAmount: () => number;
  /** Computed — TCS (1%) in paise */
  tcsAmount: () => number;
  /** Computed — final total in paise */
  total: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, sellerName, sellerType) => {
        // Product status guard — can't add out-of-stock or preorder items
        // Auth is checked by the ProductCard component (useSession) + the
        // server-side POST /api/cart route (requireAuth). The Zustand store
        // should NOT do auth checks — it's a client-side cache that syncs
        // to the server. The server is the source of truth for auth.
        if (product.status === "out_of_stock" || product.status === "preorder") {
          return;
        }

        const existing = get().items.find((i) => i.productId === product.id);
        if (existing) {
          // Already in cart — bump quantity but cap at stock
          const newQty = Math.min(existing.quantity + 1, product.stock);
          set({
            items: get().items.map((i) =>
              i.productId === product.id ? { ...i, quantity: newQty } : i
            ),
            isOpen: true, // open the cart drawer on add
          });
          return;
        }
        const item: CartItem = {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          ref: product.ref,
          sellerId: product.sellerId,
          sellerName,
          sellerType,
          priceInr: product.priceInr,
          quantity: 1,
          shipsInDays: product.shipsInDays,
          warrantyMonths: product.warrantyMonths,
          dialColor: product.dialColor,
          caseFinish: product.caseFinish,
          complicationType: product.complicationType,
          limited: product.limited,
        };
        set({ items: [...get().items, item], isOpen: true });
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.priceInr * i.quantity, 0),

      gstAmount: () => {
        const sub = get().subtotal();
        return calculateGST(sub).gst;
      },

      tcsAmount: () => {
        const sub = get().subtotal();
        return calculateTCS(sub);
      },

      total: () => {
        const sub = get().subtotal();
        const tcs = calculateTCS(sub);
        // GST is already inclusive in subtotal, so total = subtotal + tcs
        return sub + tcs;
      },
    }),
    {
      name: "bay-cart",
      // Only persist items, not isOpen
      partialize: (state) => ({ items: state.items }),
    }
  )
);
