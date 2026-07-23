import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SELLERS } from "@/lib/bay/data";

/**
 * GET /api/sellers
 * Returns all verified sellers (public — for the shop filter sidebar).
 */
export async function GET() {
  try {
    const sellers = await db.seller.findMany({
      where: {
        kycStatus: "verified",
        deletedAt: null,
      },
      select: {
        id: true,
        companyName: true,
        slug: true,
        type: true,
        city: true,
        established: true,
        specialty: true,
        verified: true,
        bayAuthorized: true,
        rating: true,
        reviewCount: true,
        story: true,
      },
      orderBy: { rating: "desc" },
    });

    if (sellers.length > 0) {
      return NextResponse.json(sellers);
    }
  } catch {
    // Database not configured — fall through to static data
  }

  // Fallback: static data
  return NextResponse.json(SELLERS);
}
