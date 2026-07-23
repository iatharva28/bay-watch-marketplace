import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth-helpers";

/**
 * GET /api/seller/orders
 * Returns orders containing the authenticated seller's products.
 */
export async function GET() {
  const { session, error } = await requireSeller();
  if (error) return error;

  const seller = await db.seller.findUnique({
    where: { userId: session!.user.id },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  // Find order items for this seller, then get the parent orders
  const orderItems = await db.orderItem.findMany({
    where: { sellerId: seller.id },
    include: {
      order: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
    },
    orderBy: { order: { placedAt: "desc" } },
  });

  // Group by order
  const ordersMap = new Map();
  for (const item of orderItems) {
    if (!ordersMap.has(item.order.id)) {
      ordersMap.set(item.order.id, {
        ...item.order,
        items: [],
      });
    }
    ordersMap.get(item.order.id).items.push(item);
  }

  return NextResponse.json(Array.from(ordersMap.values()));
}
