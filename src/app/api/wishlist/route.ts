import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * GET /api/wishlist
 * Returns the authenticated user's wishlist.
 */
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const wishlist = await db.wishlistItem.findMany({
    where: { userId: session!.user.id },
    include: {
      product: {
        include: {
          seller: {
            select: { id: true, companyName: true, type: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(wishlist);
}

const AddToWishlistSchema = z.object({
  productId: z.string().min(1),
});

/**
 * POST /api/wishlist
 * Adds a product to the wishlist (idempotent — no error if already there).
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const parsed = AddToWishlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { productId } = parsed.data;

  // Use upsert to make it idempotent
  const item = await db.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId: session!.user.id,
        productId,
      },
    },
    update: {}, // No-op if already exists
    create: {
      userId: session!.user.id,
      productId,
    },
  });

  return NextResponse.json(item);
}

/**
 * DELETE /api/wishlist?productId=xxx
 * Removes a product from the wishlist.
 */
export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  await db.wishlistItem.deleteMany({
    where: {
      userId: session!.user.id,
      productId,
    },
  });

  return NextResponse.json({ success: true });
}
