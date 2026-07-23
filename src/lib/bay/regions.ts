/**
 * BAY Multi-Region Configuration
 *
 * Architectural principle: Prices are stored in INR paise (canonical).
 * Each region defines its own price ranges + display format. When a
 * new region is added (EMEA, LATAM, US, APAC), only this file changes —
 * no other code needs to know about currencies.
 *
 * Phase 2 (currency conversion): Add an `exchangeRate` field to each
 * region and a `convertFromINR()` function. The display layer calls
 * `formatPrice()` which handles conversion + notation.
 *
 * Active region: Stored in a cookie `bay-region` (defaults to "in").
 * In production, set this via geo-IP lookup at the edge (proxy.ts).
 */

export type RegionCode = "in" | "emea" | "latam" | "us" | "apac";

export type PriceRange = {
  /** Stable ID — used in URLs, filters, API params */
  id: string;
  /** Min price in INR paise (inclusive) */
  minPaise: number;
  /** Max price in INR paise (exclusive). null = no upper bound. */
  maxPaise: number | null;
};

export type RegionConfig = {
  code: RegionCode;
  name: string;
  /** ISO 4217 currency code */
  currency: "INR" | "USD" | "EUR" | "BRL";
  /** Symbol used in display */
  symbol: string;
  /** BCP 47 locale for number formatting */
  locale: string;
  /** Whether to use lakh/crore notation (India) or thousand/million */
  useIndianNotation: boolean;
  /** Price ranges for the filter sidebar (in INR paise — canonical) */
  priceRanges: PriceRange[];
  /** Exchange rate from INR to this region's currency (Phase 2) */
  // exchangeRate?: number;
};

/**
 * INDIA — Primary market
 *
 * 6 ranges covering the full Indian watch market:
 *   1. ₹1,000 – ₹2,500       (entry quartz — Fastrack, Titan entry)
 *   2. ₹2,500 – ₹5,000       (mid quartz — Timex, Casio)
 *   3. ₹5,000 – ₹15,000      (entry mechanical — Seiko 5, Tissot entry)
 *   4. ₹15,000 – ₹50,000     (mid-luxury — Tissot, Hamilton, Certina)
 *   5. ₹50,000 – ₹1,00,000   (entry luxury — Longines, Oris, TAG Heuer entry)
 *   6. ₹1,00,000 – ₹1.5 Crore (luxury — Omega, Rolex, Patek, BAY own-brand)
 *
 * Stored in paise (1 INR = 100 paise).
 */
const INDIA_PRICE_RANGES: PriceRange[] = [
  {
    id: "in-1k-2.5k",
    minPaise: 100_000,      // ₹1,000
    maxPaise: 250_000,     // ₹2,500
  },
  {
    id: "in-2.5k-5k",
    minPaise: 250_000,      // ₹2,500
    maxPaise: 500_000,      // ₹5,000
  },
  {
    id: "in-5k-15k",
    minPaise: 500_000,      // ₹5,000
    maxPaise: 1_500_000,   // ₹15,000
  },
  {
    id: "in-15k-50k",
    minPaise: 1_500_000,    // ₹15,000
    maxPaise: 5_000_000,    // ₹50,000
  },
  {
    id: "in-50k-1l",
    minPaise: 5_000_000,    // ₹50,000
    maxPaise: 10_000_000,  // ₹1,00,000 (1 Lakh)
  },
  {
    id: "in-1l-1.5cr",
    minPaise: 10_000_000,   // ₹1 Lakh
    maxPaise: 1_500_000_000, // ₹1.5 Crore
  },
];

/**
 * All supported regions.
 *
 * EMEA / LATAM / US / APAC use the SAME INR boundaries for now.
 * Phase 2: each region gets its own price ranges in local currency,
 * plus an exchange rate for conversion at display time.
 */
export const REGIONS: Record<RegionCode, RegionConfig> = {
  in: {
    code: "in",
    name: "India",
    currency: "INR",
    symbol: "₹",
    locale: "en-IN",
    useIndianNotation: true,
    priceRanges: INDIA_PRICE_RANGES,
  },
  emea: {
    code: "emea",
    name: "EMEA (Europe, Middle East, Africa)",
    currency: "EUR",
    symbol: "€",
    locale: "en-IE",
    useIndianNotation: false,
    priceRanges: INDIA_PRICE_RANGES, // Reuse INR boundaries until currency conversion is built
  },
  latam: {
    code: "latam",
    name: "Latin America",
    currency: "USD",
    symbol: "US$",
    locale: "es-MX",
    useIndianNotation: false,
    priceRanges: INDIA_PRICE_RANGES, // Reuse until currency-specific ranges are added
  },
  us: {
    code: "us",
    name: "United States",
    currency: "USD",
    symbol: "$",
    locale: "en-US",
    useIndianNotation: false,
    priceRanges: INDIA_PRICE_RANGES, // Reuse until currency-specific ranges are added
  },
  apac: {
    code: "apac",
    name: "Asia-Pacific",
    currency: "USD",
    symbol: "$",
    locale: "en-SG",
    useIndianNotation: false,
    priceRanges: INDIA_PRICE_RANGES, // Reuse until currency-specific ranges are added
  },
};

/** Default region (used when no cookie / geo-IP data is available) */
export const DEFAULT_REGION: RegionCode = "in";

/**
 * Get the active region for the current request.
 *
 * Client-side: reads the `bay-region` cookie.
 * Server-side: reads from the request cookies (in proxy.ts / API routes).
 * Fallback: DEFAULT_REGION.
 *
 * Phase 2: implement geo-IP lookup via Cloudflare's `cf-ipcountry` header
 * in proxy.ts, mapping country code → region code.
 */
export function getActiveRegion(): RegionConfig {
  if (typeof document !== "undefined") {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("bay-region="));
    if (cookie) {
      const code = cookie.split("=")[1] as RegionCode;
      if (REGIONS[code]) return REGIONS[code];
    }
  }
  return REGIONS[DEFAULT_REGION];
}

/**
 * Set the active region (client-side). Persists for 1 year.
 */
export function setActiveRegion(code: RegionCode): void {
  if (typeof document === "undefined") return;
  document.cookie = `bay-region=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Get the price ranges for the active region.
 * Used by FilterSidebar to render the price filter options.
 */
export function getPriceRanges(region?: RegionConfig): PriceRange[] {
  return (region ?? getActiveRegion()).priceRanges;
}

/**
 * Format a price for display in the active region's currency + notation.
 *
 * India uses lakh/crore notation (₹1,50,000 = 1.5 lakh).
 * Other regions use thousand/million notation.
 *
 * @param paise - The price in INR paise (canonical storage)
 * @param region - Optional region override (defaults to active)
 * @returns Formatted string, e.g. "₹1.50 L" or "€1,250"
 */
export function formatPrice(
  paise: number,
  region?: RegionConfig
): string {
  const r = region ?? getActiveRegion();
  const rupees = paise / 100;

  if (r.useIndianNotation) {
    // Indian lakh/crore notation
    if (rupees >= 1_00_00_000) {
      // Crore (1,00,00,000 = 1 crore)
      return `₹${(rupees / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (rupees >= 1_00_000) {
      // Lakh (1,00,000 = 1 lakh)
      return `₹${(rupees / 1_00_000).toFixed(2)} L`;
    }
    // Below 1 lakh — show full amount with Indian grouping
    return `₹${rupees.toLocaleString("en-IN")}`;
  }

  // International notation (Phase 2: currency conversion)
  // For now, since prices are stored in INR, we display in INR
  // but with international grouping (1,000,000 instead of 10,00,000)
  if (rupees >= 1_000_000) {
    return `₹${(rupees / 1_000_000).toFixed(2)}M`;
  }
  if (rupees >= 1_00_000) {
    return `₹${(rupees / 1_000).toFixed(0)}K`;
  }
  return `₹${rupees.toLocaleString("en-US")}`;
}

/**
 * Format a price with full grouping (no lakh/crore abbreviation).
 * Used in checkout + cart totals where exact amounts matter.
 *
 * @param paise - The price in INR paise
 * @param region - Optional region override
 * @returns Full formatted string, e.g. "₹1,50,000" (India) or "₹1,500,000" (intl)
 */
export function formatPriceFull(
  paise: number,
  region?: RegionConfig
): string {
  const r = region ?? getActiveRegion();
  const rupees = paise / 100;

  if (r.useIndianNotation) {
    return `₹${rupees.toLocaleString("en-IN")}`;
  }
  return `₹${rupees.toLocaleString("en-US")}`;
}

/**
 * Get the display label for a price range (e.g. "₹1,000 – ₹2,500").
 * Used by FilterSidebar.
 */
export function getPriceRangeLabel(
  range: PriceRange,
  region?: RegionConfig
): string {
  const minLabel = formatPriceFull(range.minPaise, region);
  if (range.maxPaise === null) {
    return `Above ${minLabel}`;
  }
  const maxLabel = formatPriceFull(range.maxPaise, region);
  return `${minLabel} – ${maxLabel}`;
}

/**
 * Check if a price (in paise) falls within a given range.
 */
export function priceInRange(paise: number, range: PriceRange): boolean {
  if (paise < range.minPaise) return false;
  if (range.maxPaise !== null && paise >= range.maxPaise) return false;
  return true;
}

/**
 * Find the price range that contains the given price.
 * Returns null if no range matches (e.g., price is below the lowest range).
 */
export function findPriceRange(
  paise: number,
  region?: RegionConfig
): PriceRange | null {
  const ranges = getPriceRanges(region);
  return ranges.find((r) => priceInRange(paise, r)) ?? null;
}
