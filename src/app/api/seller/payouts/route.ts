import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth-helpers";

/**
 * GET /api/seller/payouts
 * Returns the authenticated seller's payout history.
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

  const payouts = await db.payout.findMany({
    where: { sellerId: seller.id },
    include: {
      payoutItems: {
        include: {
          order: {
            select: { orderNumber: true, placedAt: true },
          },
        },
      },
    },
    orderBy: { periodEnd: "desc" },
  });

  return NextResponse.json(payouts);
}
