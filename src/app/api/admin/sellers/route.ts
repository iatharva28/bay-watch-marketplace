import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * GET /api/admin/sellers
 * Returns all sellers (admin only).
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const sellers = await db.seller.findMany({
    include: {
      user: {
        select: { id: true, email: true },
      },
      _count: {
        select: { products: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sellers);
}

const UpdateSellerSchema = z.object({
  kycStatus: z.enum(["pending", "submitted", "verified", "rejected"]).optional(),
  kycRejectedReason: z.string().optional(),
  commissionRate: z.number().int().min(0).max(50).optional(),
  verified: z.boolean().optional(),
  bayAuthorized: z.boolean().optional(),
});

/**
 * PATCH /api/admin/sellers
 * Updates a seller's KYC status, commission, or verification.
 * Body: { sellerId, ...updates }
 */
export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { sellerId, ...updates } = body;

  const parsed = UpdateSellerSchema.safeParse(updates);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Build the update object from validated fields only — no `any` spread
  const data: {
    kycStatus?: "pending" | "submitted" | "verified" | "rejected";
    kycRejectedReason?: string;
    commissionRate?: number;
    verified?: boolean;
    bayAuthorized?: boolean;
    kycVerifiedAt?: Date;
  } = {};

  if (parsed.data.kycStatus !== undefined) data.kycStatus = parsed.data.kycStatus;
  if (parsed.data.kycRejectedReason !== undefined) data.kycRejectedReason = parsed.data.kycRejectedReason;
  if (parsed.data.commissionRate !== undefined) data.commissionRate = parsed.data.commissionRate;
  if (parsed.data.verified !== undefined) data.verified = parsed.data.verified;
  if (parsed.data.bayAuthorized !== undefined) data.bayAuthorized = parsed.data.bayAuthorized;

  // Set verification timestamp when KYC is approved
  if (parsed.data.kycStatus === "verified") {
    data.kycVerifiedAt = new Date();
  }

  const seller = await db.seller.update({
    where: { id: sellerId },
    data,
  });

  return NextResponse.json(seller);
}
