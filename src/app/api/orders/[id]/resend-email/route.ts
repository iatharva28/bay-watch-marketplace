import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { sendOrderConfirmationEmail } from "@/lib/bay/email";

/**
 * POST /api/orders/[id]/resend-email
 *
 * Resends the order confirmation email. Used when:
 *   - The original email failed to send (checkout succeeded but email failed)
 *   - The customer deleted the email and wants it again
 *   - The customer's spam filter ate it
 *
 * Authorization: only the order owner or an admin can resend.
 */

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Authorization: owner or admin
  if (order.userId !== session!.user.id && session!.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only resend for paid orders
  if (order.paymentStatus !== "captured") {
    return NextResponse.json(
      { error: "Email can only be resent for paid orders" },
      { status: 400 }
    );
  }

  const itemsWithEmail = order.items.map((i) => ({
    name: i.name,
    ref: i.ref,
    quantity: i.quantity,
    price: `₹${(i.priceInr / 100).toLocaleString("en-IN")}`,
  }));

  const totalEmail = `₹${(order.totalInr / 100).toLocaleString("en-IN")}`;

  const result = await sendOrderConfirmationEmail(
    order.user.email,
    order.orderNumber,
    totalEmail,
    itemsWithEmail
  );

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
