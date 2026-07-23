import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * GET /api/seller/products
 * Returns the authenticated seller's products.
 */
export async function GET() {
  const { session, error } = await requireSeller();
  if (error) return error;

  // Get the seller record for this user
  const seller = await db.seller.findUnique({
    where: { userId: session!.user.id },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  const products = await db.product.findMany({
    where: { sellerId: seller.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

const ProductCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  ref: z.string().trim().min(2).max(50),
  family: z.string().trim().min(2).max(100),
  categoryId: z.string().min(1),
  tagline: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(2000),
  fullDescription: z.string().trim().min(20).max(5000),
  complication: z.string().trim().min(2).max(200),
  movement: z.string().trim().min(2).max(200),
  caseMaterial: z.string().trim().min(2).max(100),
  caseDiameter: z.string().trim().min(2).max(50),
  waterResistance: z.string().trim().min(2).max(50),
  powerReserve: z.string().trim().min(2).max(50),
  production: z.string().trim().min(2).max(50),
  priceInr: z.number().int().min(10000).max(1000000000),
  mrpInr: z.number().int().optional(),
  stock: z.number().int().min(0).max(999),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  dialColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  caseFinish: z.enum(["polished_platinum", "brushed_steel", "sandblasted_titanium", "obsidian_ceramic"]),
  complicationType: z.enum(["time_only", "tourbillon", "perpetual_calendar", "minute_repeater", "gmt", "chronograph", "diver", "ultra_thin", "skeleton", "grand_sonnerie", "astrological", "grand_complication"]),
  limited: z.boolean().optional(),
  warrantyMonths: z.number().int().min(1).max(120),
  shipsInDays: z.number().int().min(0).max(90),
});

/**
 * POST /api/seller/products
 * Creates a new product for the authenticated seller.
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireSeller();
  if (error) return error;

  const seller = await db.seller.findUnique({
    where: { userId: session!.user.id },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  if (seller.kycStatus !== "verified") {
    return NextResponse.json(
      { error: "KYC verification required before listing products" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = ProductCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Generate slug from name
  const slug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check slug + ref uniqueness
  const existingSlug = await db.product.findUnique({ where: { slug } });
  if (existingSlug) {
    return NextResponse.json({ error: "Product slug already exists" }, { status: 409 });
  }

  const existingRef = await db.product.findUnique({ where: { ref: parsed.data.ref } });
  if (existingRef) {
    return NextResponse.json({ error: "Reference number already exists" }, { status: 409 });
  }

  const product = await db.product.create({
    data: {
      ...parsed.data,
      slug,
      sellerId: seller.id,
      shippingInr: 0,
      status: parsed.data.stock > 0 ? "active" : "out_of_stock",
    },
  });

  return NextResponse.json(product);
}
