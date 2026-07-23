"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PRODUCTS, SELLERS, getSellerById } from "@/lib/bay/data";
import { getPriceRanges, priceInRange } from "@/lib/bay/regions";
import ProductCard from "@/components/marketplace/ProductCard";
import FilterSidebar, { DEFAULT_FILTERS, type Filters } from "@/components/marketplace/FilterSidebar";
import { ScrollReveal } from "@/components/bay/ScrollReveal";

/**
 * BAY /shop — the marketplace browse page.
 *
 * Layout: filter sidebar on the left, product grid on the right.
 * Keeps the Glacier Noir editorial language: section numbers,
 * mono labels, display type — but introduces the functional
 * patterns a marketplace needs (filter, sort, search, add to cart).
 */

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "newest", label: "Newest" },
];

export default function ShopPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("featured");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = [...PRODUCTS];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.categoryId));
    }

    // Seller filter
    if (filters.sellers.length > 0) {
      result = result.filter((p) => filters.sellers.includes(p.sellerId));
    }

    // Seller type filter
    if (filters.sellerTypes.length > 0) {
      result = result.filter((p) => {
        const seller = getSellerById(p.sellerId);
        return seller && filters.sellerTypes.includes(seller.type);
      });
    }

    // Price range filter — region-aware (reads range boundaries from regions.ts)
    if (filters.priceRange !== "all") {
      const ranges = getPriceRanges();
      const selectedRange = ranges.find((r) => r.id === filters.priceRange);
      if (selectedRange) {
        result = result.filter((p) => priceInRange(p.priceInr, selectedRange));
      }
    }

    // In stock filter
    if (filters.inStockOnly) {
      result = result.filter(
        (p) => p.status === "active" || p.status === "low_stock"
      );
    }

    // Sort
    switch (sort) {
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

    return result;
  }, [filters, sort, searchQuery]);

  return (
    <>
      {/* Hero header */}
      <section className="relative pt-20 pb-16 border-b border-[var(--hairline)] overflow-hidden">
        <div className="aurora-wash" />
        <div className="relative max-w-[1600px] mx-auto px-6 lg:px-10">
          <ScrollReveal direction="up">
            <div className="flex items-center gap-3 mb-6">
              <span className="section-num">/shop</span>
              <span className="w-12 h-px bg-[var(--hairline)]" />
              <span className="eyebrow">The Collection</span>
            </div>
            <h1 className="display-2 text-[var(--text)] mb-6">
              Twelve pieces.
              <br />
              <span className="italic-serif text-[var(--platinum)]">
                Six maisons.
              </span>
            </h1>
            <p className="body-lg max-w-2xl">
              BAY's own-brand collection alongside authorized dealers and
              verified vendors — each piece vetted, each seller trusted.
              GST inclusive. TCS computed at checkout. Free shipping across India.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Search bar */}
      <section className="border-b border-[var(--hairline)] py-6">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1" />
              <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1" />
            </svg>
            <input
              type="search"
              placeholder="Search by name, reference, complication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-transparent border border-[var(--hairline-strong)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--platinum)] transition-colors"
            />
          </div>
          <div className="flex items-center gap-4 md:ml-auto">
            <span className="spec-mono whitespace-nowrap">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-transparent border border-[var(--hairline-strong)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--platinum)] transition-colors cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[var(--bg)] text-[var(--text)]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Main — sidebar + grid */}
      <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            resultCount={filtered.length}
          />

          {/* Product grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-full border border-[var(--hairline)] flex items-center justify-center mb-6">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="var(--text-muted)" strokeWidth="1" />
                  <path d="M19 19l7 7" stroke="var(--text-muted)" strokeWidth="1" />
                </svg>
              </div>
              <h3 className="font-display text-3xl font-light mb-2">
                No pieces match your filters
              </h3>
              <p className="body-md mb-6">
                Try resetting the filters or adjusting your search.
              </p>
              <button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setSearchQuery("");
                }}
                className="btn-bay"
              >
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  seller={getSellerById(product.sellerId)}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust band */}
      <section className="border-t border-[var(--hairline)] py-16">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "GST Inclusive", value: "18%", note: "On all watches" },
            { label: "TCS Collected", value: "1%", note: "Remitted by BAY" },
            { label: "Free Shipping", value: "India", note: "Insured, signature required" },
            { label: "Warranty", value: "5 yrs", note: "On BAY own-brand pieces" },
          ].map((item) => (
            <div key={item.label} className="border-l border-[var(--hairline)] pl-6">
              <div className="eyebrow mb-2">{item.label}</div>
              <div className="font-display text-4xl font-light text-[var(--platinum)] mb-1">
                {item.value}
              </div>
              <div className="spec-mono">{item.note}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
