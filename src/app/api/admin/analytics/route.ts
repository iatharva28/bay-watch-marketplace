import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

/**
 * GET /api/admin/analytics
 * Returns platform-wide analytics (admin only).
 *
 * Metrics:
 *   - GMV (Gross Merchandise Value) — 30 days + all time
 *   - Commission earned — 30 days
 *   - TCS collected — 30 days
 *   - Order count — 30 days
 *   - Seller count + breakdown by type
 *   - Product count + breakdown by status
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    orders30d,
    totalOrders,
    sellers,
    products,
    totalGMV,
  ] = await Promise.all([
    db.order.findMany({
      where: {
        placedAt: { gte: thirtyDaysAgo },
        paymentStatus: "captured",
      },
      select: {
        subtotalInr: true,
        commissionInr: true,
        tcsInr: true,
        gatewayFeeInr: true,
      },
    }),
    db.order.count(),
    db.seller.findMany({
      select: {
        id: true,
        type: true,
        kycStatus: true,
        _count: { select: { products: true } },
      },
    }),
    db.product.findMany({
      select: {
        id: true,
        status: true,
        priceInr: true,
      },
    }),
    db.order.aggregate({
      where: { paymentStatus: "captured" },
      _sum: { subtotalInr: true },
    }),
  ]);

  const gmv30d = orders30d.reduce((sum, o) => sum + o.subtotalInr, 0);
  const commission30d = orders30d.reduce((sum, o) => sum + o.commissionInr, 0);
  const tcs30d = orders30d.reduce((sum, o) => sum + o.tcsInr, 0);
  const gatewayFees30d = orders30d.reduce((sum, o) => sum + o.gatewayFeeInr, 0);

  const sellersByType = {
    own_brand: sellers.filter((s) => s.type === "own_brand").length,
    authorized: sellers.filter((s) => s.type === "authorized").length,
    vendor: sellers.filter((s) => s.type === "vendor").length,
  };

  const sellersByKyc = {
    pending: sellers.filter((s) => s.kycStatus === "pending").length,
    submitted: sellers.filter((s) => s.kycStatus === "submitted").length,
    verified: sellers.filter((s) => s.kycStatus === "verified").length,
    rejected: sellers.filter((s) => s.kycStatus === "rejected").length,
  };

  const productsByStatus = {
    active: products.filter((p) => p.status === "active").length,
    low_stock: products.filter((p) => p.status === "low_stock").length,
    out_of_stock: products.filter((p) => p.status === "out_of_stock").length,
    preorder: products.filter((p) => p.status === "preorder").length,
  };

  return NextResponse.json({
    gmv: {
      thirtyDays: gmv30d,
      allTime: totalGMV._sum.subtotalInr ?? 0,
    },
    commission: {
      thirtyDays: commission30d,
    },
    tcs: {
      thirtyDays: tcs30d,
    },
    gatewayFees: {
      thirtyDays: gatewayFees30d,
    },
    orders: {
      thirtyDays: orders30d.length,
      total: totalOrders,
    },
    sellers: {
      total: sellers.length,
      byType: sellersByType,
      byKyc: sellersByKyc,
    },
    products: {
      total: products.length,
      byStatus: productsByStatus,
    },
  });
}
