import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * GET /api/orders
 * Returns the authenticated user's order history.
 */
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const orders = await db.order.findMany({
    where: { userId: session!.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              ref: true,
              dialColor: true,
              caseFinish: true,
              complicationType: true,
            },
          },
        },
      },
    },
    orderBy: { placedAt: "desc" },
  });

  return NextResponse.json(orders);
}
