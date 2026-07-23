import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/auth-helpers";
import { z } from "zod";

/**
 * POST /api/seller/kyc
 * Submits KYC documents for verification.
 *
 * The seller provides:
 *   - PAN number (Permanent Account Number)
 *   - GSTIN (GST Identification Number)
 *   - Bank account details (name, number, IFSC)
 *
 * After submission, kycStatus changes from "pending" to "submitted".
 * An admin then reviews and sets it to "verified" or "rejected".
 */

const KycSchema = z.object({
  panNumber: z
    .string()
    .trim()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g. ABCDE1234F)"),
  gstin: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format"
    ),
  bankAccountName: z.string().trim().min(2).max(200),
  bankAccountNumber: z.string().trim().min(8).max(20),
  bankIfsc: z
    .string()
    .trim()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format (e.g. HDFC0001234)"),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireSeller();
  if (error) return error;

  const seller = await db.seller.findUnique({
    where: { userId: session!.user.id },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  if (seller.kycStatus === "verified") {
    return NextResponse.json(
      { error: "KYC already verified" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = KycSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await db.seller.update({
    where: { id: seller.id },
    data: {
      ...parsed.data,
      kycStatus: "submitted",
      kycSubmittedAt: new Date(),
      kycRejectedReason: null,
    },
  });

  return NextResponse.json({
    success: true,
    kycStatus: updated.kycStatus,
    message: "KYC documents submitted. An admin will review within 48 hours.",
  });
}

/**
 * GET /api/seller/kyc
 * Returns the seller's current KYC status.
 */
export async function GET() {
  const { session, error } = await requireSeller();
  if (error) return error;

  const seller = await db.seller.findUnique({
    where: { userId: session!.user.id },
    select: {
      kycStatus: true,
      kycSubmittedAt: true,
      kycVerifiedAt: true,
      kycRejectedReason: true,
      panNumber: true,
      gstin: true,
      bankAccountName: true,
      bankIfsc: true,
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  return NextResponse.json(seller);
}
