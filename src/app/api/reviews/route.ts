import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * POST /api/reviews
 * Creates a product review. Only verified buyers can review.
 *
 * A "verified buyer" is a user who has a delivered order containing
 * this product. This prevents fake reviews.
 */

const ReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(2000),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "productId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const reviews = await db.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { productId, rating, title, body: reviewBody } = parsed.data;

  // Check if user already reviewed this product
  const existing = await db.review.findUnique({
    where: {
      productId_userId: {
        productId,
        userId: session!.user.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this product" },
      { status: 409 }
    );
  }

  // Check if user is a verified buyer (has a delivered order with this product)
  const verifiedOrder = await db.order.findFirst({
    where: {
      userId: session!.user.id,
      status: "delivered",
      items: { some: { productId } },
    },
  });

  const review = await db.review.create({
    data: {
      productId,
      userId: session!.user.id,
      rating,
      title,
      body: reviewBody,
      verified: !!verifiedOrder,
    },
    include: {
      user: {
        select: { id: true, fullName: true },
      },
    },
  });

  // Update the seller's rating using a SQL aggregate (O(1) query, not O(n×m))
  // Calculates the average rating across ALL the seller's products' reviews
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  });

  if (product?.sellerId) {
    const result = await db.$queryRaw<{
      avg_rating: number | null;
      review_count: bigint;
    }[]>`
      SELECT
        AVG(r.rating)::numeric(2,1) as avg_rating,
        COUNT(*)::bigint as review_count
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE p.seller_id = ${product.sellerId}
    `;

    if (result.length > 0 && result[0].avg_rating !== null) {
      await db.seller.update({
        where: { id: product.sellerId },
        data: {
          rating: Number(result[0].avg_rating),
          reviewCount: Number(result[0].review_count),
        },
      });
    }
  }

  return NextResponse.json(review);
}
