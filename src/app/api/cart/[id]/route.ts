import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * PATCH /api/cart/[id]
 * Updates the quantity of a cart item. If quantity is 0, deletes the item.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = z.object({ quantity: z.number().int().min(0).max(99) }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  // Verify the cart item belongs to the authenticated user
  const cartItem = await db.cartItem.findUnique({
    where: { id },
    include: { cart: true },
  });

  if (!cartItem || cartItem.cart.userId !== session!.user.id) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  if (parsed.data.quantity === 0) {
    await db.cartItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  // Cap at product stock
  const product = await db.product.findUnique({
    where: { id: cartItem.productId },
    select: { stock: true },
  });
  if (product && parsed.data.quantity > product.stock) {
    return NextResponse.json(
      { error: `Only ${product.stock} units available` },
      { status: 400 }
    );
  }

  const updated = await db.cartItem.update({
    where: { id },
    data: { quantity: parsed.data.quantity },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/cart/[id]
 * Removes an item from the cart.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const cartItem = await db.cartItem.findUnique({
    where: { id },
    include: { cart: true },
  });

  if (!cartItem || cartItem.cart.userId !== session!.user.id) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  await db.cartItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
