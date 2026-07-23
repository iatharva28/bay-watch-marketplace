import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PRODUCTS, getSellerById } from "@/lib/bay/data";

/**
 * GET /api/products/[slug]
 * Returns a single product with seller + reviews.
 *
 * Tries the database first, falls back to the static data.ts if the
 * database isn't configured (sandbox / early development).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Try database first
  try {
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        seller: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: {
            user: {
              select: { id: true, fullName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (product) {
      return NextResponse.json(product);
    }
  } catch {
    // Database not configured — fall through to static data
  }

  // Fallback: static data from data.ts
  const staticProduct = PRODUCTS.find((p) => p.slug === slug);
  if (!staticProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const seller = getSellerById(staticProduct.sellerId);
  return NextResponse.json({
    ...staticProduct,
    seller,
  });
}
