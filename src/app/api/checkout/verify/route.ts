import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";
import { verifyPaymentSignature } from "@/lib/bay/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/bay/email";
import { calculateItemPayout } from "@/lib/bay/settlement";

/**
 * POST /api/checkout/verify
 *
 * Verifies the Razorpay payment signature and finalizes the order(s):
 *   1. Verify the HMAC signature (CRITICAL — can't be forged)
 *   2. Find ALL orders sharing this razorpayOrderId (multi-seller)
 *   3. Atomically decrement stock (conditional WHERE stock >= qty)
 *   4. Update order status to "paid" + calculate per-item payouts
 *   5. Clear the user's cart
 *   6. Send order confirmation email
 *   7. Create notifications for each seller
 *
 * If verification fails, orders stay "pending" — no stock is decremented.
 *
 * Atomic stock: uses conditional UPDATE WHERE stock >= qty. If
 * rowCount === 0, the stock was insufficient (race condition with
 * another buyer). The transaction rolls back and the payment is
 * refunded automatically by Razorpay (or manually via the admin).
 */

const VerifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  console.log("[verify] Received body:", body);
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    console.log("[verify] Zod validation failed:", parsed.error.flatten());
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  // 1. Find ALL orders with this razorpayOrderId (multi-seller support)
  const orders = await db.order.findMany({
    where: {
      razorpayOrderId,
      userId: session!.user.id,
    },
    include: {
      items: true,
      user: true,
    },
  });

  if (orders.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // 2. Verify the signature
  const isValid = verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    return NextResponse.json(
      { error: "Payment verification failed. Please contact support." },
      { status: 400 }
    );
  }

  // 3. Finalize all orders in a transaction
  let stockFailure = false;
  let stockFailureProduct = "";

  try {
    await db.$transaction(async (tx) => {
      // Process each order (there may be multiple for multi-seller carts)
      for (const order of orders) {
        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "paid",
            paymentStatus: "captured",
            razorpayPaymentId,
            razorpaySignature,
            paymentCapturedAt: new Date(),
            paidAt: new Date(),
          },
        });

        // Atomically decrement stock + calculate per-item payouts
        for (const item of order.items) {
          // Atomic conditional update: only decrements if stock >= qty
          const result = await tx.$executeRaw`
            UPDATE products
            SET stock = stock - ${item.quantity}
            WHERE id = ${item.productId} AND stock >= ${item.quantity}
          `;

          if (result === 0) {
            // Stock was insufficient — race condition
            stockFailure = true;
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { name: true },
            });
            stockFailureProduct = product?.name ?? item.name;
            throw new Error(`STOCK_FAILURE: ${stockFailureProduct}`);
          }

          // Auto-update product status if stock is now low or out
          const updatedProduct = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });
          if (updatedProduct) {
            if (updatedProduct.stock === 0) {
              await tx.product.update({
                where: { id: item.productId },
                data: { status: "out_of_stock" },
              });
            } else if (updatedProduct.stock <= 5) {
              await tx.product.update({
                where: { id: item.productId },
                data: { status: "low_stock" },
              });
            }
          }

          // Calculate per-item payout using the shared function
          const itemPayout = calculateItemPayout(
            item.priceInr,
            item.quantity,
            item.commissionRate,
            item.itemTcsInr // Use the pre-allocated TCS from checkout
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

        // Create notification for the seller
        if (order.sellerId) {
          const seller = await tx.seller.findUnique({
            where: { id: order.sellerId },
            select: { userId: true },
          });
          if (seller?.userId) {
            await tx.notification.create({
              data: {
                userId: seller.userId,
                type: "new_order",
                title: "New order received",
                body: `Order ${order.orderNumber} has been paid and is ready for processing.`,
                data: {
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                },
              },
            }).catch(() => {});
          }
        }
      }

      // Clear the cart (outside the order loop — only once)
      await tx.cartItem.deleteMany({
        where: { cart: { userId: session!.user.id } },
      });
    });
  } catch (err: any) {
    if (err?.message?.startsWith("STOCK_FAILURE")) {
      // Stock race condition — the payment was captured but stock is gone
      // Phase 2: auto-refund via Razorpay refund API
      return NextResponse.json(
        {
          error: `We're sorry — ${stockFailureProduct} just sold out. Your payment will be refunded within 5-7 business days. Please contact support if you don't receive your refund.`,
          code: "STOCK_FAILURE",
        },
        { status: 409 }
      );
    }
    throw err; // Re-throw other errors
  }

  // 4. Send confirmation email (outside transaction — non-blocking)
  const primaryOrder = orders[0];
  const allItems = orders.flatMap((o) => o.items);
  const itemsWithEmail = allItems.map((i) => ({
    name: i.name,
    ref: i.ref,
    quantity: i.quantity,
    price: `₹${(i.priceInr / 100).toLocaleString("en-IN")}`,
  }));

  const totalEmail = `₹${(orders.reduce((s, o) => s + o.totalInr, 0) / 100).toLocaleString("en-IN")}`;

  await sendOrderConfirmationEmail(
    primaryOrder.user.email,
    primaryOrder.orderNumber,
    totalEmail,
    itemsWithEmail
  ).catch(() => {
    // Email failure shouldn't fail the checkout
    // Phase 2: add a "resend email" endpoint + cron job
  });

  return NextResponse.json({
    success: true,
    orderIds: orders.map((o) => o.id),
    orderNumber: primaryOrder.orderNumber,
    sellerCount: orders.length,
  });
}
