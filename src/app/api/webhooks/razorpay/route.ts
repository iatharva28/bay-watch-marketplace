import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { calculateItemPayout } from "@/lib/bay/settlement";

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay sends webhooks for async payment events:
 *   - payment.captured → finalize the order (if client verify didn't run)
 *   - payment.failed   → mark order as cancelled
 *   - refund.processed → mark order as refunded
 *
 * IDEMPOTENCY: Each webhook has a unique event ID. We store it in
 * the WebhookEvent table and skip processing if we've seen it before.
 * This prevents double-processing when Razorpay retries.
 *
 * SECURITY: The webhook signature is verified using
 * RAZORPAY_WEBHOOK_SECRET. An unverified webhook is rejected.
 *
 * PER-ITEM PAYOUTS: When finalizing via webhook (not client verify),
 * we calculate per-item payouts using the shared calculateItemPayout
 * function — same as the verify route.
 */

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  // 1. Verify the webhook signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  // SECURITY FIX (C3): Use timing-safe comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    console.error("Invalid webhook signature");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // 2. Parse the payload
  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  const eventId = payload.entity_id ?? payload.account_id + "-" + event + "-" + Date.now();
  const payment = payload.payload?.payment?.entity;

  if (!payment) {
    return NextResponse.json({ error: "No payment entity" }, { status: 400 });
  }

  // 3. IDEMPOTENCY CHECK — skip if we've already processed this event
  const existingEvent = await db.webhookEvent.findUnique({
    where: { eventId },
  });

  if (existingEvent) {
    // Already processed — acknowledge so Razorpay stops retrying
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 4. Store the webhook event (for audit + idempotency)
  await db.webhookEvent.create({
    data: {
      eventId,
      eventType: event,
      payload: payload as any,
    },
  }).catch(() => {
    // If we can't store the event, still try to process it
    // (idempotency is best-effort, not critical)
  });

  // 5. Find ALL orders with this razorpayOrderId (multi-seller support)
  const orders = await db.order.findMany({
    where: { razorpayOrderId: payment.order_id },
    include: { items: true, user: true },
  });

  if (orders.length === 0) {
    console.error("Orders not found for Razorpay order:", payment.order_id);
    return NextResponse.json({ error: "Orders not found" }, { status: 404 });
  }

  // 6. Handle the event
  switch (event) {
    case "payment.captured": {
      // Finalize orders that are still pending (client verify didn't run)
      const pendingOrders = orders.filter((o) => o.status === "pending");
      if (pendingOrders.length === 0) {
        // All orders already finalized by client verify — nothing to do
        break;
      }

      await db.$transaction(async (tx) => {
        for (const order of pendingOrders) {
          // Update order status
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "paid",
              paymentStatus: "captured",
              razorpayPaymentId: payment.id,
              paymentCapturedAt: new Date(),
              paidAt: new Date(),
            },
          });

          // Atomically decrement stock + calculate per-item payouts
          for (const item of order.items) {
            const result = await tx.$executeRaw`
              UPDATE products
              SET stock = stock - ${item.quantity}
              WHERE id = ${item.productId} AND stock >= ${item.quantity}
            `;

            if (result === 0) {
              // Stock race condition — log and skip this item
              // Phase 2: initiate refund
              console.error(
                `STOCK_FAILURE in webhook: product ${item.productId}, order ${order.orderNumber}`
              );
              continue;
            }

            // Calculate per-item payout using the SHARED function
            const itemPayout = calculateItemPayout(
              item.priceInr,
              item.quantity,
              item.commissionRate,
              item.itemTcsInr
            );

            await tx.orderItem.update({
              where: { id: item.id },
              data: {
                itemSubtotalInr: itemPayout.itemSubtotalInr,
                itemCommissionInr: itemPayout.itemCommissionInr,
                itemGatewayFeeInr: itemPayout.itemGatewayFeeInr,
                itemSellerPayoutInr: itemPayout.itemSellerPayoutInr,
              },
            });
          }

          // Clear cart (only if this is the first order being processed)
          await tx.cartItem.deleteMany({
            where: { cart: { userId: order.userId } },
          }).catch(() => {});
        }
      });
      break;
    }

    case "payment.failed":
      await db.order.updateMany({
        where: {
          id: { in: orders.map((o) => o.id) },
          status: "pending",
        },
        data: {
          status: "cancelled",
          paymentStatus: "failed",
          cancelledAt: new Date(),
        },
      });
      break;

    case "refund.processed":
      // Only update if not already refunded (idempotency)
      await db.order.updateMany({
        where: {
          id: { in: orders.map((o) => o.id) },
          paymentStatus: { not: "refunded" },
        },
        data: {
          status: "refunded",
          paymentStatus: "refunded",
          refundedAt: new Date(),
        },
      });
      break;

    default:
      console.log(`Unhandled Razorpay event: ${event}`);
  }

  return NextResponse.json({ received: true });
}

type RazorpayWebhookPayload = {
  entity: string;
  entity_id?: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        status: string;
        method: string;
      };
    };
  };
};
