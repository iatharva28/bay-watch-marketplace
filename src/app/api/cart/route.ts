import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * GET /api/cart
 * Returns the authenticated user's cart with product details.
 */
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const cart = await db.cart.findUnique({
    where: { userId: session!.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  companyName: true,
                  type: true,
                },
              },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!cart) {
    return NextResponse.json({ items: [] });
  }

  return NextResponse.json(cart);
}

const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).optional(),
});

/**
 * POST /api/cart
 * Adds an item to the cart (or increments quantity if already present).
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const parsed = AddToCartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { productId, quantity = 1 } = parsed.data;

  // Fetch the product to validate + snapshot the price
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { seller: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.status === "out_of_stock" || product.stock === 0) {
    return NextResponse.json({ error: "Product is out of stock" }, { status: 400 });
  }

  if (quantity > product.stock) {
    return NextResponse.json(
      { error: `Only ${product.stock} units available` },
      { status: 400 }
    );
  }

  // Get or create the user's cart
  let cart = await db.cart.findUnique({
    where: { userId: session!.user.id },
    include: { items: true },
  });

  if (!cart) {
    cart = await db.cart.create({
      data: { userId: session!.user.id },
      include: { items: true },
    });
  }

  // Check if item already in cart
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, product.stock);
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        priceInr: product.priceInr, // Snapshot at add time
      },
    });
  }

  // Return the updated cart
  const updatedCart = await db.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: { product: { include: { seller: true } } },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  return NextResponse.json(updatedCart);
}
