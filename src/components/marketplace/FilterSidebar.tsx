"use client";

import { CATEGORIES, SELLERS } from "@/lib/bay/data";
import { getPriceRanges, getPriceRangeLabel, type PriceRange } from "@/lib/bay/regions";
import { cn } from "@/lib/utils";

/**
 * BAY FilterSidebar — uses the region-aware price range config
 * from src/lib/bay/regions.ts. When a new region is activated
 * (e.g., EMEA), the price ranges automatically switch to that
 * region's currency + boundaries.
 *
 * The filter IDs are now region-specific (e.g., "in-1k-2.5k")
 * so the same filter can work across regions without collision.
 */

export type Filters = {
  categories: string[];
  sellers: string[];
  sellerTypes: ("own_brand" | "authorized" | "vendor")[];
  priceRange: string; // The range ID, or "all"
  inStockOnly: boolean;
};

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  sellers: [],
  sellerTypes: [],
  priceRange: "all",
  inStockOnly: false,
};

const SELLER_TYPE_LABELS = {
  own_brand: "BAY Maison",
  authorized: "BAY Authorized",
  vendor: "Verified Vendors",
} as const;

export default function FilterSidebar({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
}) {
  const toggle = (key: "categories" | "sellers" | "sellerTypes", value: string) => {
    const arr = filters[key] as string[];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    onChange({ ...filters, [key]: next });
  };

  const reset = () => onChange(DEFAULT_FILTERS);

  // Get region-aware price ranges
  const priceRanges = getPriceRanges();

  return (
    <aside className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="eyebrow mb-1">Filter</div>
          <div className="font-display text-2xl font-light">Refine</div>
        </div>
        <button
          onClick={reset}
          className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--platinum)] transition-colors"
        >
          Reset
        </button>
      </div>

      {/* In stock */}
      <div className="mb-8 pb-8 border-b border-[var(--hairline)]">
        <label className="flex items-center gap-3 cursor-pointer group">
          <span
            className={cn(
              "w-4 h-4 border flex items-center justify-center transition-colors",
              filters.inStockOnly
                ? "bg-[var(--platinum)] border-[var(--platinum)]"
                : "border-[var(--hairline-strong)] group-hover:border-[var(--platinum)]"
            )}
          >
            {filters.inStockOnly && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="text-sm text-[var(--text-soft)] group-hover:text-[var(--text)] transition-colors">
            In stock only
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
          />
        </label>
      </div>

      {/* Price range — region-aware */}
      <div className="mb-8 pb-8 border-b border-[var(--hairline)]">
        <div className="eyebrow mb-4">Price</div>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <span
              className={cn(
                "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors",
                filters.priceRange === "all"
                  ? "border-[var(--platinum)]"
                  : "border-[var(--hairline-strong)] group-hover:border-[var(--platinum)]"
              )}
            >
              {filters.priceRange === "all" && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--platinum)]" />
              )}
            </span>
            <span className="text-sm text-[var(--text-soft)] group-hover:text-[var(--text)] transition-colors">
              All Prices
            </span>
            <input
              type="radio"
              name="priceRange"
              className="sr-only"
              checked={filters.priceRange === "all"}
              onChange={() => onChange({ ...filters, priceRange: "all" })}
            />
          </label>

          {priceRanges.map((range) => (
            <label key={range.id} className="flex items-center gap-3 cursor-pointer group">
              <span
                className={cn(
                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors",
                  filters.priceRange === range.id
                    ? "border-[var(--platinum)]"
                    : "border-[var(--hairline-strong)] group-hover:border-[var(--platinum)]"
                )}
              >
                {filters.priceRange === range.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--platinum)]" />
                )}
              </span>
              <span className="text-sm text-[var(--text-soft)] group-hover:text-[var(--text)] transition-colors">
                {getPriceRangeLabel(range)}
              </span>
              <input
                type="radio"
                name="priceRange"
                className="sr-only"
                checked={filters.priceRange === range.id}
                onChange={() => onChange({ ...filters, priceRange: range.id })}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Seller type */}
      <div className="mb-8 pb-8 border-b border-[var(--hairline)]">
        <div className="eyebrow mb-4">Seller Type</div>
        <div className="space-y-2">
          {(Object.keys(SELLER_TYPE_LABELS) as Array<keyof typeof SELLER_TYPE_LABELS>).map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <span
                className={cn(
                  "w-4 h-4 border flex items-center justify-center transition-colors",
                  filters.sellerTypes.includes(type)
                    ? "bg-[var(--platinum)] border-[var(--platinum)]"
                    : "border-[var(--hairline-strong)] group-hover:border-[var(--platinum)]"
                )}
              >
                {filters.sellerTypes.includes(type) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-[var(--text-soft)] group-hover:text-[var(--text)] transition-colors">
                {SELLER_TYPE_LABELS[type]}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.sellerTypes.includes(type)}
                onChange={() => toggle("sellerTypes", type)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8 pb-8 border-b border-[var(--hairline)]">
        <div className="eyebrow mb-4">Category</div>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <span
                className={cn(
                  "w-4 h-4 border flex items-center justify-center transition-colors",
                  filters.categories.includes(cat.id)
                    ? "bg-[var(--platinum)] border-[var(--platinum)]"
                    : "border-[var(--hairline-strong)] group-hover:border-[var(--platinum)]"
                )}
              >
                {filters.categories.includes(cat.id) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-[var(--text-soft)] group-hover:text-[var(--text)] transition-colors flex-1">
                {cat.name}
              </span>
              <span className="spec-mono">{cat.count}</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.categories.includes(cat.id)}
                onChange={() => toggle("categories", cat.id)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="spec-mono">
        Showing {resultCount} {resultCount === 1 ? "piece" : "pieces"}
      </div>
    </aside>
  );
}
