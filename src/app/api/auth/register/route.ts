import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimiters } from "@/lib/rate-limit";

/**
 * POST /api/auth/register
 *
 * Creates a new user (customer or seller). For sellers, also creates
 * a Seller record with KYC status "pending" — they can't list products
 * until an admin verifies their KYC.
 *
 * Body:
 *   fullName, email, phone, password, role,
 *   company?, gstin?  (required if role === "seller")
 */

const RegisterSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().trim().min(10).max(15),
  // Password: min 8 chars, must contain at least 1 letter + 1 number
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["customer", "seller"]),
  company: z.string().trim().max(200).optional(),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .optional()
    .or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 registrations per 5 minutes per IP
    const limited = rateLimiters.register(request);
    if (limited) return limited;

    const body = await request.json();
    console.log('[DEBUG] Registration body:', JSON.stringify(body, null, 2));
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fullName, email, phone, password, role, company, gstin } = parsed.data;

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Seller-specific validation
    if (role === "seller" && (!company || !gstin)) {
      return NextResponse.json(
        { error: "Company name and GSTIN are required for seller accounts" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + seller (if seller role) in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          fullName,
          phone,
          passwordHash,
          role,
          emailVerified: new Date(), // Auto-verify for MVP; Phase 2: email verification flow
        },
      });

      if (role === "seller") {
        // Generate slug from company name
        const slug = company!
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        await tx.seller.create({
          data: {
            userId: newUser.id,
            companyName: company!,
            slug,
            type: "vendor", // New sellers default to vendor; admin can upgrade to authorized
            kycStatus: "pending",
            gstin,
            commissionRate: 14, // Default commission rate
            rating: 0,
            reviewCount: 0,
          },
        });
      }

      // Create empty cart for customer
      if (role === "customer") {
        await tx.cart.create({
          data: { userId: newUser.id },
        });
      }

      return newUser;
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
