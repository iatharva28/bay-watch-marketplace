import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * GET /api/seller/products/[id]
 * Returns a single product owned by the authenticated seller.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireSeller();
  if (error) return error;

  const { id } = await params;

  const seller = await db.seller.findUnique({
    where: { userId: session!.user.id },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  const product = await db.product.findFirst({
    where: { id, sellerId: seller.id },
    include: {
      category: true,
      images: true,
      reviews: {
        include: { user: { select: { fullName: true } } },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

const ProductUpdateSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  tagline: z.string().trim().min(5).max(200).optional(),
  description: z.string().trim().min(20).max(2000).optional(),
  fullDescription: z.string().trim().min(20).max(5000).optional(),
  priceInr: z.number().int().min(10000).max(1000000000).optional(),
  mrpInr: z.number().int().optional(),
  stock: z.number().int().min(0).max(999).optional(),
  status: z.enum(["active", "low_stock", "out_of_stock", "preorder"]).optional(),
  featured: z.boolean().optional(),
  warrantyMonths: z.number().int().min(1).max(120).optional(),
  shipsInDays: z.number().int().min(0).max(90).optional(),
});

/**
 * PATCH /api/seller/products/[id]
 * Updates a product owned by the authenticated seller.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireSeller();
  if (error) return error;

  const { id } = await params;

  const seller = await db.seller.findUnique({
    where: { userId: session!.user.id },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  // Verify ownership
  const product = await db.product.findFirst({
    where: { id, sellerId: seller.id },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = ProductUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Auto-update status based on stock
  const updates: any = { ...parsed.data };
  if (parsed.data.stock !== undefined) {
    if (parsed.data.stock === 0) {
      updates.status = "out_of_stock";
    } else if (parsed.data.stock <= 5) {
      updates.status = "low_stock";
    } else if (!parsed.data.status) {
      updates.status = "active";
    }
  }

  const updated = await db.product.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/seller/products/[id]
 * Soft-deletes a product (sets deletedAt timestamp).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireSeller();
  if (error) return error;

  const { id } = await params;

  const seller = await db.seller.findUnique({
    where: { userId: session!.user.id },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  const product = await db.product.findFirst({
    where: { id, sellerId: seller.id },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Soft delete — don't actually remove (orders reference it)
  await db.product.update({
    where: { id },
    data: { deletedAt: new Date(), status: "out_of_stock" },
  });

  return NextResponse.json({ success: true });
}
