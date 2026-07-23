# BAY Maison

![BAY - Quiet Luxury. Timeless Precision.](https://images.unsplash.com/image1.jpg?alt=BAY%20Maison%20Hero)

A production-grade, multi-seller luxury watch marketplace built with Next.js 16 (App Router), Prisma/PostgreSQL, NextAuth v4, and Razorpay. Designed for the Indian market with full GST/TCS compliance.

> **"We do not compete through loud marketing — only through craftsmanship, mechanical excellence, and design that outlives the moment."**

---

## ✨ Collections Showcase

![BAY Collections - Meridian, Eclipse, Aurora, Vertx](https://images.unsplash.com/image2.jpg?alt=Watch%20Collections)

*Curated timepieces: from the dress watch to grand complications.*

---

## Architecture & Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.1.x | React Server Components, Server Actions, Edge middleware |
| **Runtime** | Bun (dev) / Node.js (prod) | 1.x / 20+ | Development with hot-reload; production standalone output |
| **Database** | PostgreSQL (Neon Serverless) | 16+ | Primary data store; pooled connections via `DATABASE_URL` (port 6543) |
| **ORM** | Prisma Client | 6.19.x | Type-safe database access; singleton pattern for serverless |
| **Auth** | NextAuth.js (Credentials + Google) | 4.24.x | JWT sessions, httpOnly cookies, role-based access (customer/seller/admin) |
| **Payments** | Razorpay | 2.9.x | UPI, cards, net banking, EMI; webhook idempotency + HMAC-SHA256 verification |
| **Email** | Resend (React Email) | 6.17.x | Transactional emails (order confirmations, payouts) |
| **Validation** | Zod | 4.x | Runtime schema validation on every API boundary |
| **State** | Zustand + TanStack Query | 5.x / 5.82.x | Client state + server cache synchronization |
| **UI** | Radix UI + Tailwind CSS 4 | Latest | Unstyled accessible primitives; utility-first styling |
| **Rate Limiting** | In-memory (dev) / Redis-ready (prod) | Custom | Env-driven limits; fingerprint-based client ID; survives hot reloads |
| **Security** | CSRF (double-submit), CSP, HSTS, timing-safe HMAC | Custom + Next.js | Edge middleware + per-route verification |

### Key Architectural Patterns

| Pattern | Implementation |
|---------|----------------|
| **Prisma Singleton** | `src/lib/db.ts` caches `PrismaClient` on `globalThis` to prevent connection pool exhaustion on serverless (Neon) |
| **Multi-Seller Order Splitting** | Single cart → grouped by `sellerId` → one `Order` per seller sharing a single `razorpayOrderId`; suffix `A/B/C` on `orderNumber` |
| **Atomic Stock Decrement** | `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?` inside a Prisma transaction; rolls back on race condition |
| **Shared Settlement Engine** | `src/lib/bay/settlement.ts` — single source of truth for GST extraction, TCS allocation, commission, gateway fees, seller payouts; reused by `/api/checkout/verify` |
| **Idempotent Webhooks** | `WebhookEvent` table stores `eventId`; duplicate Razorpay retries are acknowledged and skipped |
| **Edge Auth Proxy** | `src/proxy.ts` runs at the edge, verifies NextAuth JWT, applies CSP/HSTS headers before page render |

---

## Database Schema (Prisma)

Key models (see `prisma/schema.prisma` for full definitions):

```
User (customer | seller | admin)
  └─ Seller (companyName, slug, type: own_brand|authorized|vendor, kycStatus, commissionRate, gstin)
  └─ Address[]
  └─ Cart → CartItem[]
  └─ Order[]
  └─ WishlistItem[]

Order (orderNumber, status, paymentStatus, subtotal, gst, tcs, shipping, total, commission, gatewayFee, sellerPayout, razorpayOrderId, razorpayPaymentId)
  └─ OrderItem[] (productId, name, ref, priceInr, quantity, sellerId, sellerName, commissionRate, itemSubtotal, itemCommission, itemGatewayFee, itemTcs, itemSellerPayout)

Product (slug, ref, name, priceInr, stock, status, sellerId, categoryId, complicationType, caseFinish, warrantyMonths, shipsInDays)
  └─ Seller

WebhookEvent (eventId @unique, eventType, payload)  -- idempotency store
Notification (userId, type, title, body, read, data)
```

**Enums**: `UserRole`, `SellerType`, `KycStatus`, `ProductStatus`, `ProductCaseFinish`, `ProductComplicationType`, `OrderStatus`, `PaymentStatus`, `PayoutStatus`.

---

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/register` | POST | Public (rate-limited) | Create user (+ seller profile if role=seller) |
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth handlers (credentials, Google) |
| `/api/cart` | GET/POST/DELETE | Customer | View/add/remove cart items (price snapshot at add) |
| `/api/checkout` | POST | Customer (rate-limited) | Validate cart, group by seller, calculate settlement, create Orders, create Razorpay Order |
| `/api/checkout/verify` | POST | Customer | Verify Razorpay signature, atomic stock decrement, finalize orders, clear cart, send email |
| `/api/webhooks/razorpay` | POST | Signature-verified | Idempotent handling of `payment.captured`, `payment.failed`, `refund.processed` |
| `/api/seller/*` | Various | Seller | Dashboard, products, orders, payouts |
| `/api/admin/*` | Various | Admin | User/seller management, analytics, payouts |

---

## Local Development Setup

### Prerequisites
- **Bun** ≥ 1.1 (or Node.js 20+ with npm)
- **PostgreSQL** (local or Neon cloud)
- **Razorpay** test account (for payments)
- **Resend** account (for emails) or use `onboarding@resend.dev` (dev only)

### Commands

```bash
# Install deps
bun install          # or npm install

# Database
bun run db:generate  # Prisma generate
bun run db:push      # Push schema (dev)
bun run db:migrate   # Create migration
bun run db:seed      # Seed sellers, products, categories
bun run db:studio    # Prisma Studio

# Dev server (port 3000, logs to dev.log)
bun run dev

# Production build (standalone output)
bun run build

# Lint
bun run lint
```

---

## Deployment (Vercel)

### Pre-deployment Checklist

- [ ] **Environment Variables** configured in Vercel project settings:
  - `DATABASE_URL` (Neon pooled, port 6543)
  - `DIRECT_URL` (Neon direct, port 5432) — required for `prisma migrate deploy`
  - `NEXTAUTH_SECRET` (strong random string)
  - `NEXTAUTH_URL` (your production domain, e.g. `https://baymaison.in`)
  - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (live keys)
  - `RAZORPAY_WEBHOOK_SECRET` (from Razorpay dashboard → Webhooks)
  - `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DOMAIN_VERIFIED=true`
  - `RATE_LIMIT_*_MAX` / `RATE_LIMIT_*_WINDOW_MS` (production values)
- [ ] **Build Command**: `bun run build` (outputs `.next/standalone/`)
- [ ] **Output Directory**: `.next/standalone` (configured via `next.config.ts` `output: "standalone"`)
- [ ] **Database Migration**: Run `bun run db:migrate deploy` in CI or via Vercel `build` hook
- [ ] **Razorpay Webhook URL**: `https://your-domain.vercel.app/api/webhooks/razorpay` (POST, JSON)
- [ ] **CSP Allowed Domains**: Update `src/proxy.ts` `Content-Security-Policy` `connect-src`/`frame-src` if using custom domains for Razorpay/fonts

### Post-Deploy Verification

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Webhook test (from Razorpay dashboard → "Test Webhook")
# Should return 200 { "received": true }

# Auth flow
# 1. Register → verify session cookie set (httpOnly, secure)
# 2. Login → JWT in cookie, role in token
# 3. Access /seller → redirect to /auth/register?role=seller if customer
```

---

## Platform UI & Footer

![BAY Maison Footer - Navigation, Account, Seller Portal](https://images.unsplash.com/image3.jpg?alt=BAY%20Platform%20Footer)

*Seamless navigation across shop, seller portal, and admin dashboard.*

---

## AI-Assisted Engineering Workflow

This project was built using **advanced AI-assisted development** as a force-multiplier for a solo engineer:

- **Models**: Z.ai GLM-5.2 (primary reasoning), GPT-4o-class models for code generation
- **Agent**: Hermes Agent (Nous Research) for pair programming, architecture planning, real-time debugging, security auditing, and skill authoring
- **Workflow**:
  - **Architecture Design**: Collaborative system design sessions — database schema, API contracts, settlement engine, multi-seller order splitting
  - **Implementation**: AI writes ~80% of boilerplate, validation, API routes, middleware, Prisma schema; engineer reviews, refines, and integrates
  - **Security Auditing**: Systematic review of CSRF, IDOR, timing attacks, webhook idempotency, rate limiting, CSP, HSTS — findings tracked as `SECURITY FIX (C1..C5)` comments in code
  - **Debugging**: Real-time log analysis, stack trace interpretation, race condition identification (stock decrement), Prisma connection pooling fixes
  - **Skill Authoring**: Reusable Hermes skills created for recurring patterns (Next.js debugging, Prisma patterns, Razorpay integration, security hardening)

This approach compresses what would typically require a 3–4 person team (backend, frontend, DevOps, security) into a single engineer with AI amplification — without sacrificing code quality, observability, or security posture.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # NextAuth + register
│   │   ├── cart/           # Cart CRUD
│   │   ├── checkout/       # Create + verify orders
│   │   ├── webhooks/       # Razorpay webhook
│   │   ├── seller/         # Seller portal APIs
│   │   └── admin/          # Admin APIs
│   ├── (auth)/             # Login, register pages
│   ├── (shop)/             # Product listing, detail, cart, checkout
│   ├── (seller)/           # Seller dashboard
│   └── (admin)/            # Admin panel
├── components/
│   ├── ui/                 # Radix-based primitives
│   ├── shop/               # Product cards, carousel, filters
│   ├── checkout/           # Address, payment, summary
│   └── seller/             # Seller-specific components
├── lib/
│   ├── auth-config.ts      # NextAuth options (shared)
│   ├── auth-helpers.ts     # requireAuth, requireRole, requireSeller, requireAdmin
│   ├── csrf.ts             # Double-submit CSRF protection
│   ├── db.ts               # Prisma singleton
│   ├── rate-limit.ts       # Env-driven, fingerprint-based limiter
│   ├── bay/
│   │   ├── razorpay.ts     # Order create, signature verify, refund
│   │   ├── settlement.ts   # GST/TCS/commission/payout engine
│   │   ├── email.ts        # Resend templates
│   │   ├── data.ts         # Static product/seller data (marketing site)
│   │   └── auth-types.ts   # Shared auth types
│   └── utils.ts            # cn(), formatInr(), etc.
├── hooks/                  # React hooks (useCart, useAuth, etc.)
├── proxy.ts                # Edge middleware (auth + security headers)
└── middleware.ts           # (redirects to proxy.ts in Next.js 16)
```

---

## License

Proprietary — BAY Maison. All rights reserved.
