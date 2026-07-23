/**
 * BAY Settlement Engine
 *
 * Core business logic for calculating commissions, GST, TCS, and
 * seller payouts. Used by the checkout flow, payout scheduling,
 * and the admin analytics dashboard.
 *
 * India compliance:
 *   - GST: 18% on watches, INCLUSIVE in the displayed price
 *   - TCS: 1% collected by BAY on marketplace sales, remitted quarterly
 *   - Payment gateway fee: ~2% (Razorpay)
 *   - Commission: per-seller (0% for BAY own-brand, 11-14% for others)
 *
 * Payout timing: T+3 days after delivery (covers the return window)
 */

export type SettlementBreakdown = {
  // Per-item
  itemSubtotal: number; // price × quantity (GST-inclusive)
  itemGST: number; // GST component
  itemTCS: number; // TCS collected
  itemCommission: number; // BAY's commission
  itemGatewayFee: number; // Payment gateway fee
  itemSellerPayout: number; // What the seller receives

  // Totals
  subtotal: number;
  gst: number;
  tcs: number;
  commission: number;
  gatewayFee: number;
  sellerPayout: number;
  total: number; // What the customer pays (subtotal + tcs)
};

export type SettlementItem = {
  productId: string;
  priceInr: number; // paise, GST-inclusive
  quantity: number;
  sellerId: string;
  commissionRate: number; // percentage, 0 for own-brand
};

export const GST_RATE = 0.18; // 18%
export const TCS_RATE = 0.01; // 1%
export const GATEWAY_FEE_RATE = 0.02; // 2% (Razorpay)

/**
 * Calculate the GST component of a GST-inclusive price.
 * If price is ₹118 (inclusive of 18% GST), base = 100, GST = 18.
 */
export function calculateGST(priceInr: number): {
  base: number;
  gst: number;
  total: number;
} {
  const base = Math.round(priceInr / (1 + GST_RATE));
  const gst = priceInr - base;
  return { base, gst, total: priceInr };
}

/**
 * Calculate TCS (1% of the price).
 * Collected by BAY on behalf of the seller, remitted to the government.
 */
export function calculateTCS(priceInr: number): number {
  return Math.round(priceInr * TCS_RATE);
}

/**
 * Calculate the full settlement breakdown for a set of items.
 *
 * Flow:
 *   1. Subtotal = sum(price × qty) — GST-inclusive
 *   2. GST = extract from subtotal
 *   3. TCS = 1% of subtotal (added on top, customer pays this)
 *   4. Total = subtotal + TCS (customer pays this)
 *   5. Per seller: commission = sellerSubtotal × commissionRate
 *   6. Per seller: gatewayFee = sellerSubtotal × 2%
 *   7. Per seller: payout = sellerSubtotal - commission - gatewayFee - TCS
 *
 * Note: TCS is deducted from the SELLER's payout, not added to the
 * customer's total. Wait — actually per Indian law, TCS is collected
 * from the buyer at checkout. So:
 *   - Customer pays: subtotal + TCS
 *   - BAY remits TCS to government
 *   - Seller receives: subtotal - commission - gatewayFee
 *   (TCS is NOT deducted from seller — it's collected from buyer)
 */
export function calculateSettlement(
  items: SettlementItem[]
): SettlementBreakdown {
  let subtotal = 0;
  let gst = 0;
  let commission = 0;
  let gatewayFee = 0;

  // First pass: calculate per-item values (without TCS — needs total first)
  const itemBreakdowns = items.map((item) => {
    const itemSubtotal = item.priceInr * item.quantity;
    const { gst: itemGST } = calculateGST(itemSubtotal);
    const itemCommission = Math.round(
      (itemSubtotal * item.commissionRate) / 100
    );
    const itemGatewayFee = Math.round(itemSubtotal * GATEWAY_FEE_RATE);
    const itemSellerPayout = itemSubtotal - itemCommission - itemGatewayFee;

    subtotal += itemSubtotal;
    gst += itemGST;
    commission += itemCommission;
    gatewayFee += itemGatewayFee;

    return {
      itemSubtotal,
      itemGST,
      itemTCS: 0, // Allocated in second pass (proportional)
      itemCommission,
      itemGatewayFee,
      itemSellerPayout,
    };
  });

  // TCS is 1% of subtotal, collected from customer
  const tcs = calculateTCS(subtotal);
  const total = subtotal + tcs;
  const sellerPayout = subtotal - commission - gatewayFee;

  // Second pass: allocate TCS proportionally per item
  // This ensures per-seller TCS reports are accurate for quarterly remittance
  let allocatedTcs = 0;
  itemBreakdowns.forEach((item, index) => {
    if (index === itemBreakdowns.length - 1) {
      // Last item gets the remainder to avoid rounding drift
      item.itemTCS = tcs - allocatedTcs;
    } else {
      const proportion = subtotal > 0 ? item.itemSubtotal / subtotal : 0;
      item.itemTCS = Math.round(tcs * proportion);
      allocatedTcs += item.itemTCS;
    }
  });

  return {
    ...itemBreakdowns.reduce(
      (acc, item) => ({
        itemSubtotal: acc.itemSubtotal + item.itemSubtotal,
        itemGST: acc.itemGST + item.itemGST,
        itemTCS: acc.itemTCS + item.itemTCS,
        itemCommission: acc.itemCommission + item.itemCommission,
        itemGatewayFee: acc.itemGatewayFee + item.itemGatewayFee,
        itemSellerPayout: acc.itemSellerPayout + item.itemSellerPayout,
      }),
      {
        itemSubtotal: 0,
        itemGST: 0,
        itemTCS: 0,
        itemCommission: 0,
        itemGatewayFee: 0,
        itemSellerPayout: 0,
      }
    ),
    subtotal,
    gst,
    tcs,
    commission,
    gatewayFee,
    sellerPayout,
    total,
  };
}

/**
 * Calculate the payout date for an order.
 * Indian marketplace standard: T+3 days after delivery.
 * This covers the return window — if the customer returns the item,
 * the payout is cancelled.
 */
export function calculatePayoutDate(deliveredAt: Date): Date {
  const payoutDate = new Date(deliveredAt);
  payoutDate.setDate(payoutDate.getDate() + 3);
  return payoutDate;
}

/**
 * Generate a unique order number.
 * Format: BAY-XXXXX-XXXX (alphanumeric, uppercase)
 * Excludes ambiguous characters (I, O, 0, 1) for readability.
 */
export function generateOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 5 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
  const part2 = Array.from({ length: 4 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
  return `BAY-${part1}-${part2}`;
}

/**
 * Calculate per-item settlement breakdown for a single OrderItem.
 *
 * This is the SHARED function used by both /api/checkout/verify and
 * /api/webhooks/razorpay to ensure consistent payout calculations
 * regardless of which path finalizes the order.
 *
 * @param priceInr - The item's price in paise (GST-inclusive)
 * @param quantity - The quantity ordered
 * @param commissionRate - The seller's commission rate (percentage)
 * @param tcsAmount - The TCS allocated to this item (pre-calculated)
 * @returns All per-item settlement fields needed for OrderItem
 */
export function calculateItemPayout(
  priceInr: number,
  quantity: number,
  commissionRate: number,
  tcsAmount: number
): {
  itemSubtotalInr: number;
  itemCommissionInr: number;
  itemGatewayFeeInr: number;
  itemTcsInr: number;
  itemSellerPayoutInr: number;
} {
  const itemSubtotal = priceInr * quantity;
  const itemCommission = Math.round(
    (itemSubtotal * commissionRate) / 100
  );
  const itemGatewayFee = Math.round(itemSubtotal * GATEWAY_FEE_RATE);
  const itemSellerPayout = itemSubtotal - itemCommission - itemGatewayFee;

  return {
    itemSubtotalInr: itemSubtotal,
    itemCommissionInr: itemCommission,
    itemGatewayFeeInr: itemGatewayFee,
    itemTcsInr: tcsAmount,
    itemSellerPayoutInr: itemSellerPayout,
  };
}

/**
 * Allocate TCS across multiple items proportionally.
 * The last item absorbs rounding drift so the sum is always exact.
 *
 * @param items - Array of { subtotal, tcs } where subtotal is the item's
 *                price × quantity
 * @param totalTcs - The total TCS to allocate
 * @returns Array of per-item TCS amounts (same order as input)
 */
export function allocateTcsAcrossItems(
  items: { itemSubtotal: number }[],
  totalTcs: number
): number[] {
  const totalSubtotal = items.reduce((s, i) => s + i.itemSubtotal, 0);
  if (totalSubtotal === 0) return items.map(() => 0);

  const result: number[] = [];
  let allocated = 0;

  items.forEach((item, index) => {
    if (index === items.length - 1) {
      // Last item gets the remainder
      result.push(totalTcs - allocated);
    } else {
      const proportion = item.itemSubtotal / totalSubtotal;
      const itemTcs = Math.round(totalTcs * proportion);
      result.push(itemTcs);
      allocated += itemTcs;
    }
  });

  return result;
}
