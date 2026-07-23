import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  // Verify ownership
  const existing = await db.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== session!.user.id) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  // If setting as default, unset others
  if (body.isDefault) {
    await db.address.updateMany({
      where: { userId: session!.user.id, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }

  const updated = await db.address.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const existing = await db.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== session!.user.id) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await db.address.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
