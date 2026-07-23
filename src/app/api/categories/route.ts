import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/bay/data";

/**
 * GET /api/categories
 * Returns all product categories.
 */
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    if (categories.length > 0) {
      return NextResponse.json(categories);
    }
  } catch {
    // Database not configured — fall through to static data
  }

  // Fallback: static data
  return NextResponse.json(CATEGORIES);
}
