import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS, SELLERS, getSellerById } from "@/lib/bay/data";
import { safeParseSearchParams } from "@/lib/validation/schemas";

/**
 * GET /api/products
 *
 * Returns the full product catalog with optional filtering.
 * Server-side validation via Zod — never trusts client input.
 *
 * Query params (all optional):
 *   q           — search query (name, ref, tagline, family, complication)
 *   sort        — featured | price-asc | price-desc | newest
 *   categories  — comma-separated category IDs
 *   sellers     — comma-separated seller IDs
 *   sellerTypes — comma-separated (own_brand, authorized, vendor)
 *   priceRange  — all | under-5l | 5l-1cr | 1cr-5cr | above-5cr
 *   inStockOnly — "true" to filter out out-of-stock
 *
 * Response:
 *   { products: Product[], total: number }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query params
    const parsed = safeParseSearchParams({
      q: searchParams.get("q") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      categories: searchParams.getAll("categories"),
      sellers: searchParams.getAll("sellers"),
      sellerTypes: searchParams.getAll("sellerTypes"),
      priceRange: searchParams.get("priceRange") ?? undefined,
      inStockOnly: searchParams.get("inStockOnly") ?? undefined,
    });

    let result = [...PRODUCTS].filter((p) => !(p as any).deletedAt);

    // Search
    if (parsed.q) {
      const q = parsed.q.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.ref.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.family.toLowerCase().includes(q) ||
          p.complication.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (parsed.categories && parsed.categories.length > 0) {
      result = result.filter((p) => parsed.categories!.includes(p.categoryId));
    }

    // Seller filter
    if (parsed.sellers && parsed.sellers.length > 0) {
      result = result.filter((p) => parsed.sellers!.includes(p.sellerId));
    }

    // Seller type filter
    if (parsed.sellerTypes && parsed.sellerTypes.length > 0) {
      result = result.filter((p) => {
        const seller = getSellerById(p.sellerId);
        return seller && parsed.sellerTypes!.includes(seller.type);
      });
    }

    // Price range filter
    if (parsed.priceRange && parsed.priceRange !== "all") {
      result = result.filter((p) => {
        const r = p.priceInr / 100;
        switch (parsed.priceRange) {
          case "under-5l":
            return r < 500000;
          case "5l-1cr":
            return r >= 500000 && r < 10000000;
          case "1cr-5cr":
            return r >= 10000000 && r < 50000000;
          case "above-5cr":
            return r >= 50000000;
          default:
            return true;
        }
      });
    }

    // In stock filter
    if (parsed.inStockOnly) {
      result = result.filter(
        (p) => p.status === "active" || p.status === "low_stock"
      );
    }

    // Sort
    switch (parsed.sort) {
      case "price-asc":
        result.sort((a, b) => a.priceInr - b.priceInr);
        break;
      case "price-desc":
        result.sort((a, b) => b.priceInr - a.priceInr);
        break;
      case "newest":
        result.sort((a, b) => b.year - a.year);
        break;
      case "featured":
      default:
        result.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
    }

    // Enrich with seller data
    const enriched = result.map((p) => ({
      ...p,
      seller: getSellerById(p.sellerId),
    }));

    return NextResponse.json({
      products: enriched,
      total: enriched.length,
      filters: parsed,
    });
  } catch (error) {
    console.error("API /products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
