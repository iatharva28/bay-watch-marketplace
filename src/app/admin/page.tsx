"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PRODUCTS, SELLERS, formatInr } from "@/lib/bay/data";
import { ScrollReveal } from "@/components/bay/ScrollReveal";
import { cn } from "@/lib/utils";

/**
 * BAY /admin — the marketplace admin panel.
 *
 * MVP scope:
 *   · Platform overview (GMV, commission, sellers, customers)
 *   · Sellers management (approve, suspend, commission rates)
 *   · Orders monitoring
 *   · Products moderation
 *
 * Phase 2: real auth with role-based access (admin only).
 */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "sellers", label: "Sellers" },
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const MOCK_PLATFORM_STATS = {
  gmv: 184200000, // 30 days
  commission: 12400000,
  tcsCollected: 1842000,
  activeSellers: SELLERS.length,
  totalProducts: PRODUCTS.length,
  orders30d: 47,
};

const MOCK_ADMIN_ORDERS = [
  { id: "ORD-001", customer: "Rajat M.", seller: "BAY Maison", product: "Meridian", amount: 4150000, status: "Paid", date: "2h ago" },
  { id: "ORD-002", customer: "Priya S.", seller: "BAY Maison", product: "Eclipse", amount: 24380000, status: "Shipped", date: "1d ago" },
  { id: "ORD-003", customer: "Vikram J.", seller: "Nakshatra Watches", product: "Astral", amount: 76250000, status: "Processing", date: "1d ago" },
  { id: "ORD-004", customer: "Anita R.", seller: "Horlogerie Genève", product: "Céleste", amount: 8950000, status: "Paid", date: "2d ago" },
  { id: "ORD-005", customer: "Karan B.", seller: "Titan Craft", product: "Veil", amount: 36680000, status: "Delivered", date: "3d ago" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12 lg:py-20">
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-6">
          <span className="section-num">/admin</span>
          <span className="w-12 h-px bg-[var(--hairline)]" />
          <span className="eyebrow">Platform Administration</span>
        </div>
        <h1 className="display-2 text-[var(--text)] mb-3">
          Marketplace <span className="italic-serif text-[var(--platinum)]">control</span>
        </h1>
        <p className="body-lg max-w-2xl mb-12">
          Monitor sellers, orders, and platform revenue. Approve new sellers,
          set commission rates, and ensure marketplace integrity.
        </p>
      </ScrollReveal>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[var(--hairline)] mb-12 -mb-px overflow-x-auto">
        {TABS.map((t) => (
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

      {tab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="GMV (30d)" value={formatInr(MOCK_PLATFORM_STATS.gmv)} note="Gross merchandise value" accent />
            <StatCard label="Commission (30d)" value={formatInr(MOCK_PLATFORM_STATS.commission)} note="Platform revenue" />
            <StatCard label="TCS Collected" value={formatInr(MOCK_PLATFORM_STATS.tcsCollected)} note="Remitted to govt" />
            <StatCard label="Orders (30d)" value={String(MOCK_PLATFORM_STATS.orders30d)} note="12 active" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="surface-elevated p-8">
              <div className="eyebrow-platinum mb-4">Seller Breakdown</div>
              <ul className="space-y-4">
                {SELLERS.map((seller) => {
                  const products = PRODUCTS.filter((p) => p.sellerId === seller.id);
                  const revenue = products.reduce((s, p) => s + p.priceInr, 0);
                  return (
                    <li key={seller.id} className="flex items-center justify-between py-3 border-b border-[var(--hairline)] last:border-0">
                      <div>
                        <div className="font-display text-lg font-light">{seller.name}</div>
                        <div className="spec-mono">
                          {seller.type === "own_brand" ? "Own Brand" : seller.type === "authorized" ? "Authorized" : "Vendor"}
                          {" · "}{products.length} products
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-[var(--text)]">{formatInr(revenue)}</div>
                        <div className="spec-mono">{seller.commissionRate}% commission</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="surface-elevated p-8">
              <div className="eyebrow-platinum mb-4">Recent Platform Orders</div>
              <ul className="space-y-4">
                {MOCK_ADMIN_ORDERS.slice(0, 5).map((order) => (
                  <li key={order.id} className="flex items-center justify-between py-3 border-b border-[var(--hairline)] last:border-0">
                    <div>
                      <div className="font-mono text-xs text-[var(--platinum)]">{order.id}</div>
                      <div className="font-display text-base font-light">{order.product}</div>
                      <div className="spec-mono">{order.customer} · {order.seller}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{formatInr(order.amount)}</div>
                      <div className="spec-mono">{order.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {tab === "sellers" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display text-3xl font-light mb-6">Sellers</h2>
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--hairline)]">
                  <th className="text-left p-4 spec-mono">Seller</th>
                  <th className="text-left p-4 spec-mono">Type</th>
                  <th className="text-left p-4 spec-mono">City</th>
                  <th className="text-right p-4 spec-mono">Products</th>
                  <th className="text-right p-4 spec-mono">Commission</th>
                  <th className="text-right p-4 spec-mono">Rating</th>
                  <th className="text-left p-4 spec-mono">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {SELLERS.map((seller) => {
                  const products = PRODUCTS.filter((p) => p.sellerId === seller.id);
                  return (
                    <tr key={seller.id} className="border-b border-[var(--hairline)] hover:bg-[var(--surface-1)] transition-colors">
                      <td className="p-4">
                        <div className="font-display text-lg font-light">{seller.name}</div>
                        <div className="spec-mono">Est. {seller.established}</div>
                      </td>
                      <td className="p-4 spec-mono">
                        {seller.type === "own_brand" ? "Own Brand" : seller.type === "authorized" ? "Authorized" : "Vendor"}
                      </td>
                      <td className="p-4 spec-mono">{seller.city ?? "—"}</td>
                      <td className="p-4 text-right font-mono text-sm">{products.length}</td>
                      <td className="p-4 text-right font-mono text-sm">{seller.commissionRate}%</td>
                      <td className="p-4 text-right font-mono text-sm">{seller.rating}</td>
                      <td className="p-4">
                        <span className="spec-mono text-[var(--platinum)]">Active</span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="spec-mono hover:text-[var(--platinum)] transition-colors">
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--hairline)]">
                  <th className="text-left p-4 spec-mono">Order ID</th>
                  <th className="text-left p-4 spec-mono">Customer</th>
                  <th className="text-left p-4 spec-mono">Seller</th>
                  <th className="text-left p-4 spec-mono">Product</th>
                  <th className="text-right p-4 spec-mono">Amount</th>
                  <th className="text-left p-4 spec-mono">Status</th>
                  <th className="text-left p-4 spec-mono">Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ADMIN_ORDERS.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--hairline)] hover:bg-[var(--surface-1)] transition-colors">
                    <td className="p-4 font-mono text-xs text-[var(--platinum)]">{order.id}</td>
                    <td className="p-4 text-sm">{order.customer}</td>
                    <td className="p-4 spec-mono">{order.seller}</td>
                    <td className="p-4 font-display text-lg font-light">{order.product}</td>
                    <td className="p-4 text-right font-mono text-sm">{formatInr(order.amount)}</td>
                    <td className="p-4">
                      <span className={cn(
                        "spec-mono",
                        order.status === "Delivered" && "text-[var(--platinum)]",
                        order.status === "Shipped" && "text-[var(--steel)]",
                        order.status === "Processing" && "text-[var(--ice)]",
                        order.status === "Paid" && "text-[var(--text-soft)]"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 spec-mono">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === "products" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display text-3xl font-light mb-6">All Products ({PRODUCTS.length})</h2>
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--hairline)]">
                  <th className="text-left p-4 spec-mono">Product</th>
                  <th className="text-left p-4 spec-mono">Seller</th>
                  <th className="text-right p-4 spec-mono">Price</th>
                  <th className="text-right p-4 spec-mono">Stock</th>
                  <th className="text-left p-4 spec-mono">Status</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((p) => {
                  const seller = SELLERS.find((s) => s.id === p.sellerId);
                  return (
                    <tr key={p.id} className="border-b border-[var(--hairline)] hover:bg-[var(--surface-1)] transition-colors">
                      <td className="p-4">
                        <div className="font-display text-lg font-light">{p.name}</div>
                        <div className="spec-mono">{p.ref} · {p.family}</div>
                      </td>
                      <td className="p-4 spec-mono">{seller?.name ?? "—"}</td>
                      <td className="p-4 text-right font-mono text-sm">{formatInr(p.priceInr)}</td>
                      <td className="p-4 text-right font-mono text-sm">{p.stock}</td>
                      <td className="p-4 spec-mono capitalize">{p.status.replace("_", " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ label, value, note, accent }: { label: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className="surface-elevated p-6">
      <div className="eyebrow mb-3">{label}</div>
      <div className={cn(
        "font-display text-3xl font-light mb-1",
        accent ? "text-[var(--platinum)]" : "text-[var(--text)]"
      )}>
        {value}
      </div>
      <div className="spec-mono">{note}</div>
    </div>
  );
}
