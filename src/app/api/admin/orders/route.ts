import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

/**
 * GET /api/admin/orders
 * Returns all orders (admin only).
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const orders = await db.order.findMany({
    include: {
      user: {
        select: { id: true, fullName: true, email: true },
      },
      seller: {
        select: { id: true, companyName: true },
      },
      items: {
        select: {
          id: true,
          name: true,
          ref: true,
          quantity: true,
          priceInr: true,
        },
      },
    },
    orderBy: { placedAt: "desc" },
  });

  return NextResponse.json(orders);
}
