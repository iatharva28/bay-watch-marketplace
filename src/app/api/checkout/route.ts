import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";
import { createRazorpayOrder } from "@/lib/bay/razorpay";
import { rateLimiters } from "@/lib/rate-limit";
import {
  calculateSettlement,
  calculateTCS,
  generateOrderNumber,
  allocateTcsAcrossItems,
  calculateItemPayout,
  type SettlementItem,
} from "@/lib/bay/settlement";
import { PRODUCTS } from "@/lib/bay/data";

/**
 * POST /api/checkout
 *
 * Creates BAY Order(s) + a Razorpay Order.
 *
 * Multi-seller handling: if the cart contains items from multiple
 * sellers, we create ONE order per seller (each with its own order
 * number suffix: BAY-XXXX-0001A, BAY-XXXX-0001B, etc.). This is
 * the correct marketplace pattern — each seller manages their own
 * fulfillment independently.
 *
 * However, there is ONE Razorpay Order for the total amount (the
 * customer pays once). The per-seller orders share the same
 * razorpayOrderId for payment tracking.
 *
 * Flow:
 *   1. Validate the shipping address belongs to the user
 *   2. Fetch the user's cart with products + sellers
 *   3. Validate stock for all items
 *   4. Group items by seller
 *   5. For each seller group: calculate settlement, create an Order
 *   6. Create ONE Razorpay Order for the grand total
 *   7. Return the Razorpay orderId + amount + key
 */

const CheckoutSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["razorpay", "upi", "card", "netbanking", "emi"]),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      priceInr: z.number().int().positive(),
      sellerId: z.string().min(1),
      sellerName: z.string().min(1),
      sellerType: z.enum(["own_brand", "authorized", "vendor"]),
      name: z.string().min(1),
      ref: z.string().min(1),
      slug: z.string().min(1),
      dialColor: z.string().min(1),
      caseFinish: z.string().min(1),
      complicationType: z.string().min(1),
      limited: z.boolean().optional(),
      shipsInDays: z.number().int().nonnegative(),
      warrantyMonths: z.number().int().nonnegative(),
    })
  ).min(1),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { addressId, items } = parsed.data;
  const userId = session!.user.id;

  // Rate limit: 5 checkouts per 10 minutes per user
  const limited = rateLimiters.checkout(request, userId);
  if (limited) return limited;

  // 1. Verify the address belongs to the user
  const address = await db.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) {
    return NextResponse.json(
      { error: "Shipping address not found" },
      { status: 404 }
    );
  }

  // 2. Use items from request body (sent from client)
  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "Your cart is empty" },
      { status: 400 }
    );
  }

  // 3. Validate stock (fetch products from DB using slugs)
  const productSlugs = items.map((i) => i.slug);
  const products = await db.product.findMany({
    where: { slug: { in: productSlugs } },
    include: {
      seller: {
        select: {
          id: true,
          companyName: true,
          commissionRate: true,
        },
      },
    },
  });

  if (products.length !== items.length) {
    const foundSlugs = new Set(products.map((p) => p.slug));
    const missing = items.filter((i) => !foundSlugs.has(i.slug));
    return NextResponse.json(
      { error: `Products not found: ${missing.map((i) => i.slug).join(", ")}` },
      { status: 400 }
    );
  }

  const productMap = new Map<string, typeof products[0]>(products.map((p) => [p.slug, p]));

  // SECURITY FIX (C4): Validate security-critical fields from DB, not client
  // The slug is the source of truth for product identification.
  // We only validate price (prevents manipulation) and stock.
  // DB product IDs and seller IDs are used for order creation.
  for (const item of items) {
    const product = productMap.get(item.slug);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.slug} not found` },
        { status: 400 }
      );
    }
    // Verify price matches DB (prevents price manipulation)
    if (product.priceInr !== item.priceInr) {
      console.error(
        `[SECURITY] Price mismatch: client sent ${item.priceInr} for slug ${item.slug}, DB has ${product.priceInr}`
      );
      return NextResponse.json(
        { error: "Price has changed. Please refresh your cart." },
        { status: 409 }
      );
    }
    // Verify stock
    if (product.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
        },
        { status: 400 }
      );
    }
  }

  // 4. Group items by seller
  const itemsBySeller = new Map<string, typeof items>();
  for (const item of items) {
    const product = productMap.get(item.slug);
    if (!product) continue;
    const sellerId = product.seller.id;
    if (!itemsBySeller.has(sellerId)) {
      itemsBySeller.set(sellerId, []);
    }
    itemsBySeller.get(sellerId)!.push(item);
  }

  const sellerIds = Array.from(itemsBySeller.keys());

  // 5. Calculate the grand total settlement (all items together for TCS allocation)
  const allSettlementItems: SettlementItem[] = items.map((item) => {
    const product = productMap.get(item.slug)!;
    return {
      productId: item.productId,
      priceInr: item.priceInr,
      quantity: item.quantity,
      sellerId: product.seller.id,
      commissionRate: product.seller.commissionRate,
    };
  });

  const grandSettlement = calculateSettlement(allSettlementItems);

  // Allocate TCS per item (proportional)
  const itemSubtotals = items.map((i) => ({
    itemSubtotal: i.priceInr * i.quantity,
  }));
  const tcsAllocations = allocateTcsAcrossItems(
    itemSubtotals,
    grandSettlement.tcs
  );

  // 6. Create one order per seller (with retry for order number collisions)
  const baseOrderNumber = generateOrderNumber();
  const createdOrders: Awaited<ReturnType<typeof db.order.create>>[] = [];

  for (let sellerIndex = 0; sellerIndex < sellerIds.length; sellerIndex++) {
    const sellerId = sellerIds[sellerIndex];
    const sellerItems = itemsBySeller.get(sellerId)!;

    // Calculate this seller's settlement
    const sellerSettlementItems: SettlementItem[] = sellerItems.map((item) => {
      const product = productMap.get(item.slug)!;
      return {
        productId: item.productId,
        priceInr: item.priceInr,
        quantity: item.quantity,
        sellerId: product.seller.id,
        commissionRate: product.seller.commissionRate,
      };
    });

    const sellerSettlement = calculateSettlement(sellerSettlementItems);

    // Order number: add suffix for multi-seller (A, B, C...)
    const suffix = sellerIds.length > 1
      ? String.fromCharCode(65 + sellerIndex) // A, B, C...
      : "";
    const orderNumber = `${baseOrderNumber}${suffix}`;

    // Retry loop for order number collisions (max 3 attempts)
    let order: Awaited<ReturnType<typeof db.order.create>> | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Find the TCS allocations for this seller's items
        const sellerItemTcs: number[] = [];
        let cartItemIndex = 0;
        for (const item of items) {
          const product = productMap.get(item.slug);
          if (product && product.seller.id === sellerId) {
            sellerItemTcs.push(tcsAllocations[cartItemIndex]);
          }
          cartItemIndex++;
        }

        order = await db.order.create({
          data: {
            orderNumber,
            userId,
            sellerId,
            status: "pending",
            paymentStatus: "pending",
            subtotalInr: sellerSettlement.subtotal,
            gstInr: sellerSettlement.gst,
            tcsInr: sellerSettlement.tcs,
            shippingInr: 0,
            totalInr: sellerSettlement.total,
            commissionInr: sellerSettlement.commission,
            gatewayFeeInr: sellerSettlement.gatewayFee,
            sellerPayoutInr: sellerSettlement.sellerPayout,
            shippingAddressId: addressId,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            items: {
              create: sellerItems.map((item, idx) => {
                const itemPayout = calculateItemPayout(
                  item.priceInr,
                  item.quantity,
                  productMap.get(item.slug)!.seller.commissionRate,
                  sellerItemTcs[idx] ?? 0
                );
                return {
                  productId: productMap.get(item.slug)!.id,
                  name: item.name,
                  ref: item.ref,
                  priceInr: item.priceInr,
                  quantity: item.quantity,
                  sellerId: productMap.get(item.slug)!.seller.id,
                  sellerName: item.sellerName,
                  commissionRate: productMap.get(item.slug)!.seller.commissionRate,
                  itemSubtotalInr: itemPayout.itemSubtotalInr,
                  itemCommissionInr: itemPayout.itemCommissionInr,
                  itemGatewayFeeInr: itemPayout.itemGatewayFeeInr,
                  itemTcsInr: itemPayout.itemTcsInr,
                  itemSellerPayoutInr: itemPayout.itemSellerPayoutInr,
                };
              }),
            },
          },
          include: { items: true },
        });
        break; // Success
      } catch (err: any) {
        if (err?.code === "P2002" && attempt < 2) {
          // Unique constraint violation — retry with new number
          continue;
        }
        throw err; // Different error or out of retries
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create order. Please try again." },
        { status: 500 }
      );
    }

    createdOrders.push(order);
  }

  // 7. Create ONE Razorpay Order for the grand total
  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder(
      grandSettlement.total,
      baseOrderNumber,
      {
        user_id: userId,
        seller_count: String(sellerIds.length),
      }
    );
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    // Mark all orders as cancelled
    await db.order.updateMany({
      where: { id: { in: createdOrders.map((o) => o.id) } },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    return NextResponse.json(
      { error: "Failed to initiate payment. Please try again." },
      { status: 502 }
    );
  }

  // 8. Save the Razorpay order ID to all orders
  await db.order.updateMany({
    where: { id: { in: createdOrders.map((o) => o.id) } },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  return NextResponse.json({
    orderIds: createdOrders.map((o) => o.id),
    primaryOrderId: createdOrders[0].id,
    orderNumber: baseOrderNumber,
    razorpayOrderId: razorpayOrder.id,
    amount: grandSettlement.total,
    currency: "INR",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    customerName: address.fullName,
    customerEmail: session!.user.email ?? "",
    customerPhone: address.phone,
    sellerCount: sellerIds.length,
  });
}
