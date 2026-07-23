"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PRODUCTS, SELLERS, getSellerById, formatInr } from "@/lib/bay/data";
import WatchFace from "@/components/marketplace/WatchFace";
import SellerBadge from "@/components/marketplace/SellerBadge";
import { ScrollReveal } from "@/components/bay/ScrollReveal";
import { cn } from "@/lib/utils";

/**
 * BAY /seller — the seller portal dashboard.
 *
 * MVP scope:
 *   · Overview (revenue, orders, products, rating)
 *   · My Products (list with stock + status)
 *   · Recent Orders (mock data)
 *   · Payouts (commission breakdown)
 *
 * In Phase 2 this connects to a real seller auth + backend.
 */

const SELLER_TABS = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "My Products" },
  { id: "orders", label: "Orders" },
  { id: "payouts", label: "Payouts" },
] as const;

type SellerTab = (typeof SELLER_TABS)[number]["id"];

// Mock seller — in production this comes from auth
const MOCK_SELLER_ID = "bay-maison";

const MOCK_ORDERS = [
  { id: "ORD-001", customer: "Rajat M.", product: "Meridian", date: "2 hours ago", amount: 4150000, status: "Paid" },
  { id: "ORD-002", customer: "Priya S.", product: "Eclipse", date: "Yesterday", amount: 24380000, status: "Shipped" },
  { id: "ORD-003", customer: "Vikram J.", product: "Aurora", date: "2 days ago", amount: 2780000, status: "Delivered" },
  { id: "ORD-004", customer: "Anita R.", product: "Solstice", date: "3 days ago", amount: 15820000, status: "Paid" },
  { id: "ORD-005", customer: "Karan B.", product: "Tide", date: "5 days ago", amount: 2480000, status: "Delivered" },
];

export default function SellerPage() {
  const [tab, setTab] = useState<SellerTab>("overview");
  const seller = getSellerById(MOCK_SELLER_ID);
  const sellerProducts = PRODUCTS.filter((p) => p.sellerId === MOCK_SELLER_ID);

  if (!seller) return null;

  const totalRevenue = MOCK_ORDERS.reduce((s, o) => s + o.amount, 0);
  const commission = seller.commissionRate === 0 ? 0 : Math.round(totalRevenue * (seller.commissionRate / 100));
  const netPayout = totalRevenue - commission;

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-6">
          <span className="section-num">/seller</span>
          <span className="w-12 h-px bg-[var(--hairline)]" />
          <span className="eyebrow">Seller Portal</span>
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <h1 className="display-2 text-[var(--text)] mb-3">
              {seller.name}
            </h1>
            <div className="flex items-center gap-3">
              <SellerBadge type={seller.type} size="md" />
              <span className="spec-mono">{seller.specialty}</span>
              <span className="spec-mono">Est. {seller.established}</span>
            </div>
          </div>
          <Link href="/shop" className="btn-bay">
            <span>View on Marketplace</span>
          </Link>
        </div>
      </ScrollReveal>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[var(--hairline)] mb-12 -mb-px overflow-x-auto">
        {SELLER_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "py-4 text-xs font-mono uppercase tracking-[0.18em] border-b-2 transition-colors whitespace-nowrap",
              tab === t.id
                ? "border-[var(--platinum)] text-[var(--text)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-soft)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Revenue (30d)" value={formatInr(totalRevenue)} note="All orders" />
            <StatCard label="Orders (30d)" value={String(MOCK_ORDERS.length)} note="3 active" />
            <StatCard label="Products Live" value={String(sellerProducts.length)} note={`${sellerProducts.filter(p => p.status === "active").length} in stock`} />
            <StatCard label="Rating" value={String(seller.rating)} note={`${seller.reviewCount} reviews`} />
          </div>

          {/* Recent orders */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl font-light">Recent Orders</h2>
              <button
                onClick={() => setTab("orders")}
                className="link-bay"
              >
                View All
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 6h6m0 0L6 3m3 3L6 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <OrdersTable orders={MOCK_ORDERS.slice(0, 3)} />
          </div>

          {/* Top products */}
          <div>
            <h2 className="font-display text-3xl font-light mb-6">Top Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellerProducts.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="watch-card group p-6 flex gap-4 items-center"
                >
                  <div className="w-16 h-16 shrink-0">
                    <WatchFace
                      dialColor={p.dialColor}
                      caseFinish={p.caseFinish}
                      complicationType={p.complicationType}
                      size={64}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-xl font-light truncate group-hover:text-[var(--platinum)] transition-colors">
                      {p.name}
                    </div>
                    <div className="spec-mono mb-1">{p.ref}</div>
                    <div className="font-mono text-sm text-[var(--text)]">
                      {formatInr(p.priceInr)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {tab === "products" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl font-light">My Products</h2>
            <button className="btn-bay btn-bay-solid">
              <span>Add Product</span>
            </button>
          </div>
          <div className="surface">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--hairline)]">
                  <th className="text-left p-4 spec-mono">Product</th>
                  <th className="text-left p-4 spec-mono">Ref</th>
                  <th className="text-right p-4 spec-mono">Price</th>
                  <th className="text-right p-4 spec-mono">Stock</th>
                  <th className="text-left p-4 spec-mono">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {sellerProducts.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--hairline)] hover:bg-[var(--surface-1)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 surface flex items-center justify-center">
                          <WatchFace
                            dialColor={p.dialColor}
                            caseFinish={p.caseFinish}
                            complicationType={p.complicationType}
                            size={36}
                          />
                        </div>
                        <div>
                          <div className="font-display text-lg font-light">{p.name}</div>
                          <div className="spec-mono">{p.family}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{p.ref}</td>
                    <td className="p-4 text-right font-mono text-sm">{formatInr(p.priceInr)}</td>
                    <td className="p-4 text-right font-mono text-sm">{p.stock}</td>
                    <td className="p-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button className="spec-mono hover:text-[var(--platinum)] transition-colors">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === "orders" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display text-3xl font-light mb-6">All Orders</h2>
          <OrdersTable orders={MOCK_ORDERS} />
        </motion.div>
      )}

      {tab === "payouts" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <h2 className="font-display text-3xl font-light">Payouts & Settlement</h2>
          <div className="surface-elevated p-8">
            <div className="eyebrow-platinum mb-6">Next Payout (T+3 days after delivery)</div>
            <div className="font-display text-5xl font-light text-[var(--text)] mb-2">
              {formatInr(netPayout)}
            </div>
            <div className="spec-mono">Net of commission and payment gateway fees</div>

            <div className="h-px bg-[var(--hairline)] my-8" />

            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="body-md">Gross Sales (30d)</dt>
                <dd className="font-mono text-[var(--text)]">{formatInr(totalRevenue)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="body-md">BAY Commission ({seller.commissionRate}%)</dt>
                <dd className="font-mono text-[var(--text-muted)]">−{formatInr(commission)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="body-md">Payment Gateway (2%)</dt>
                <dd className="font-mono text-[var(--text-muted)]">−{formatInr(Math.round(totalRevenue * 0.02))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="body-md">TCS Collected (1%)</dt>
                <dd className="font-mono text-[var(--text-muted)]">−{formatInr(Math.round(totalRevenue * 0.01))}</dd>
              </div>
              <div className="flex justify-between pt-4 border-t border-[var(--hairline)]">
                <dt className="font-display text-lg">Net Payout</dt>
                <dd className="font-display text-2xl font-light text-[var(--platinum)]">
                  {formatInr(netPayout - Math.round(totalRevenue * 0.02) - Math.round(totalRevenue * 0.01))}
                </dd>
              </div>
            </dl>
          </div>

          <div className="surface p-6">
            <div className="eyebrow mb-4">Payout History</div>
            <ul className="space-y-3">
              {[
                { date: "June 2025", amount: 18420000, status: "Paid" },
                { date: "May 2025", amount: 22180000, status: "Paid" },
                { date: "April 2025", amount: 15680000, status: "Paid" },
              ].map((payout) => (
                <li key={payout.date} className="flex items-center justify-between py-3 border-b border-[var(--hairline)] last:border-0">
                  <div>
                    <div className="font-display text-lg font-light">{payout.date}</div>
                    <div className="spec-mono">Settled to HDFC ••••4821</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-[var(--text)]">{formatInr(payout.amount)}</div>
                    <div className="spec-mono text-[var(--platinum)]">{payout.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="surface-elevated p-6">
      <div className="eyebrow mb-3">{label}</div>
      <div className="font-display text-3xl font-light text-[var(--platinum)] mb-1">
        {value}
      </div>
      <div className="spec-mono">{note}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    active: { label: "In Stock", classes: "text-[var(--text-soft)] border-[var(--hairline-strong)]" },
    low_stock: { label: "Low Stock", classes: "text-[var(--platinum)] border-[var(--platinum)]" },
    out_of_stock: { label: "Out of Stock", classes: "text-[var(--text-faint)] border-[var(--text-faint)]" },
    preorder: { label: "Pre-Order", classes: "text-[var(--steel)] border-[var(--steel)]" },
  };
  const c = config[status] ?? config.active;
  return (
    <span className={cn("inline-block px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.18em] border", c.classes)}>
      {c.label}
    </span>
  );
}

function OrdersTable({ orders }: { orders: typeof MOCK_ORDERS }) {
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-[var(--hairline)]">
            <th className="text-left p-4 spec-mono">Order</th>
            <th className="text-left p-4 spec-mono">Customer</th>
            <th className="text-left p-4 spec-mono">Product</th>
            <th className="text-left p-4 spec-mono">Date</th>
            <th className="text-right p-4 spec-mono">Amount</th>
            <th className="text-left p-4 spec-mono">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-[var(--hairline)] hover:bg-[var(--surface-1)] transition-colors">
              <td className="p-4 font-mono text-xs">{order.id}</td>
              <td className="p-4 text-sm">{order.customer}</td>
              <td className="p-4 font-display text-lg font-light">{order.product}</td>
              <td className="p-4 spec-mono">{order.date}</td>
              <td className="p-4 text-right font-mono text-sm">{formatInr(order.amount)}</td>
              <td className="p-4">
                <span className={cn(
                  "spec-mono",
                  order.status === "Delivered" && "text-[var(--platinum)]",
                  order.status === "Shipped" && "text-[var(--steel)]",
                  order.status === "Paid" && "text-[var(--text-soft)]"
                )}>
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
