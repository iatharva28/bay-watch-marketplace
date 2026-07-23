import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const AddressSchema = z.object({
  label: z.enum(["home", "office", "other"]).optional(),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(15),
  line1: z.string().trim().min(5).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
  notes: z.string().trim().max(500).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const addresses = await db.address.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(addresses);
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const parsed = AddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // If this is the default, unset any existing default
  if (parsed.data.isDefault) {
    await db.address.updateMany({
      where: { userId: session!.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await db.address.create({
    data: {
      userId: session!.user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json(address);
}
