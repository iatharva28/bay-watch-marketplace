# 🕐 BAY Maison

<div align="center">

![BAY Maison Hero](https://github.com/iatharva28/bay-watch-marketplace/assets/placeholder/bay-hero.png)

**We do not compete through loud marketing — only through craftsmanship, mechanical excellence, and design that outlives the moment.**

A production-grade, multi-seller luxury watch marketplace built with **Next.js 16**, **Prisma/PostgreSQL**, **NextAuth v4**, and **Razorpay**. Designed for the Indian market with full **GST/TCS compliance**.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

</div>

---

## ✨ Collections Showcase

Our curated collections represent the pinnacle of horological craftsmanship:

![Collections Grid](https://github.com/iatharva28/bay-watch-marketplace/assets/placeholder/collections-grid.png)

| Collection | Description | Price | Type |
|---|---|---|---|
| **Meridian** | The dress watch, distilled. 38.5 mm | ₹12,500 | Grand Complications |
| **Eclipse** | A flying tourbillon, veiled in mystery. 41 mm | ₹1,85,000 | Sport |
| **Aurora** | Twenty-four cities, one glance. 40 mm | ₹18,500 | Grand Complications |
| **Vertx** | An instrument, not an accessory. 42 mm | ₹35,000 | Ultra-Thin |
| **Lumen** | Time, made audible. 40 mm | ₹3,95,000 | Limited Edition |
| **Tide** | Three hundred meters, no compromises. 42 mm | ₹8,500 | Sport |
| **Solstice** | A calendar that remembers the seasons. 40 mm | ₹1,25,000 | Grand Complications |
| **Horizon** | Two point eight millimeters of perfection. 39 mm | ₹28,500 | Ultra-Thin |

Each collection features **grand complications**, **sport**, **ultra-thin**, and **limited editions**.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 16.1.x | React Server Components, Server Actions, Edge middleware |
| **Runtime** | Bun / Node.js | 1.x / 20+ | Dev: hot-reload; Prod: standalone output |
| **Database** | PostgreSQL (Neon Serverless) | 16+ | Pooled connections via `DATABASE_URL` (port 6543) |
| **ORM** | Prisma Client | 6.19.x | Type-safe access; singleton for serverless |
| **Auth** | NextAuth.js | 4.24.x | JWT, httpOnly cookies, RBAC (customer/seller/admin) |
| **Payments** | Razorpay | 2.9.x | UPI, cards, net banking, EMI; HMAC-SHA256 verification |
| **Email** | Resend + React Email | 6.17.x | Transactional emails (orders, payouts) |
| **Validation** | Zod | 4.x | Runtime schema validation at every API boundary |
| **State** | Zustand + TanStack Query | 5.x / 5.82.x | Client state + server cache sync |
| **UI** | Radix UI + Tailwind CSS 4 | Latest | Accessible primitives + utility styling |
| **Rate Limiting** | Custom (Redis-ready) | — | Env-driven, fingerprint-based client ID |
| **Security** | CSRF, CSP, HSTS | Custom + Next.js | Edge middleware + per-route verification |

### 🔐 Key Architectural Patterns

| Pattern | Implementation |
|---------|----------------|
| **Prisma Singleton** | `src/lib/db.ts` caches `PrismaClient` on `globalThis` — prevents connection pool exhaustion on serverless |
| **Multi-Seller Order Splitting** | Single cart → grouped by `sellerId` → one `Order` per seller with shared `razorpayOrderId` + `A/B/C` suffix |
| **Atomic Stock Decrement** | `UPDATE ... WHERE stock >= ?` inside transaction; rolls back on race condition |
| **Settlement Engine** | `src/lib/bay/settlement.ts` — single source of truth: GST, TCS, commission, gateway fees, payouts |
| **Idempotent Webhooks** | `WebhookEvent` table stores `eventId` — duplicate Razorpay retries are skipped |
| **Edge Auth Proxy** | `src/proxy.ts` verifies JWT at edge, applies CSP/HSTS before render |

---

## 📊 Database Schema (Prisma)

Key models (full definitions in `prisma/schema.prisma`):

```
User (customer | seller | admin)
  └─ Seller (companyName, slug, type, kycStatus, commissionRate, gstin)
  └─ Address[]
  └─ Cart → CartItem[]
  └─ Order[]
  └─ WishlistItem[]

Order (orderNumber, status, paymentStatus, subtotal, gst, tcs, shipping, total, razorpayOrderId, razorpayPaymentId)
  └─ OrderItem[] (productId, name, priceInr, quantity, sellerId, commissionRate, itemSubtotal, itemGst, itemTcs, itemSellerPayout)

Product (slug, ref, name, priceInr, stock, status, sellerId, categoryId, complicationType, caseFinish, warrantyMonths, shipsInDays)
  └─ Seller

WebhookEvent (eventId @unique, eventType, payload)
Notification (userId, type, title, body, read, data)
```

**Enums**: `UserRole`, `SellerType`, `KycStatus`, `ProductStatus`, `ProductCaseFinish`, `ProductComplicationType`, `OrderStatus`, `PaymentStatus`, `PayoutStatus`.

---

## 🔌 API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/register` | POST | Public (rate-limited) | Create user + seller profile |
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth handlers (credentials, Google) |
| `/api/cart` | GET/POST/DELETE | Customer | Cart CRUD (price snapshot at add) |
| `/api/checkout` | POST | Customer (rate-limited) | Validate, group by seller, calculate settlement, create Razorpay Order |
| `/api/checkout/verify` | POST | Customer | Verify signature, atomic stock ↓, finalize orders, email |
| `/api/webhooks/razorpay` | POST | Signature-verified | Handle `payment.captured`, `payment.failed`, `refund.processed` |
| `/api/seller/*` | Various | Seller | Dashboard, products, orders, payouts |
| `/api/admin/*` | Various | Admin | User/seller management, analytics, payouts |

---

## 🚀 Local Development Setup

### Prerequisites
```bash
✓ Bun ≥ 1.1 (or Node.js 20+ with npm)
✓ PostgreSQL (local or Neon cloud)
✓ Razorpay test account (payments)
✓ Resend account (emails) or onboarding@resend.dev (dev)
```

### Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Setup database
bun run db:generate    # Prisma codegen
bun run db:push        # Apply schema
bun run db:seed        # Seed sellers, products

# 3. Start dev server
bun run dev            # http://localhost:3000

# 4. Database studio (optional)
bun run db:studio
```

### Available Commands

```bash
bun run dev            # Dev server (port 3000, logs to dev.log)
bun run build          # Production build (.next/standalone)
bun run lint           # ESLint
bun run db:migrate     # Create migration
bun run db:push        # Push schema (dev)
bun run db:generate    # Prisma codegen
bun run db:seed        # Seed database
```

---

## 🌐 Deployment (Vercel)

### Pre-deployment Checklist

**Environment Variables** (Vercel Project Settings):
```
DATABASE_URL              Neon pooled connection (port 6543)
DIRECT_URL               Neon direct connection (port 5432) — required for migrations
NEXTAUTH_SECRET          Strong random string (openssl rand -base64 32)
NEXTAUTH_URL             Production domain (https://baymaison.in)
RAZORPAY_KEY_ID          Razorpay live key ID
RAZORPAY_KEY_SECRET      Razorpay live key secret
RAZORPAY_WEBHOOK_SECRET  From Razorpay Dashboard → Webhooks
RESEND_API_KEY           Resend API key
EMAIL_FROM               noreply@yourdomain.com
EMAIL_DOMAIN_VERIFIED    true
RATE_LIMIT_AUTH_MAX      Production rate limit for auth
RATE_LIMIT_AUTH_WINDOW_MS  Rate limit window in ms
```

**Build Configuration**:
- **Build Command**: `bun run build`
- **Output Directory**: `.next/standalone`
- **Database Migration**: Run `bun run db:migrate deploy` in CI

**Razorpay Setup**:
- Webhook URL: `https://your-domain.vercel.app/api/webhooks/razorpay` (POST, JSON)
- Update CSP in `src/proxy.ts` for Razorpay domains

### Post-Deploy Verification

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Webhook test (Razorpay Dashboard → "Test Webhook")
# Should return: 200 { "received": true }

# Auth flow verification
# 1. Register account
# 2. Verify session cookie set (httpOnly, secure)
# 3. Login & check JWT in cookie
# 4. Access /seller dashboard
```

---

## 📁 Project Structure

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
│   ├── (shop)/             # Product listing, detail, checkout
│   ├── (seller)/           # Seller dashboard & analytics
│   └── (admin)/            # Admin panel
│
├── components/
│   ├── ui/                 # Radix-based accessible primitives
│   ├── shop/               # Product cards, carousel, filters
│   ├── checkout/           # Address form, payment, summary
│   └── seller/             # Seller-specific components
│
├── lib/
│   ├── auth-config.ts      # NextAuth configuration
│   ├── auth-helpers.ts     # requireAuth, requireRole, requireSeller
│   ├── csrf.ts             # Double-submit CSRF protection
│   ├── db.ts               # Prisma singleton instance
│   ├── rate-limit.ts       # Fingerprint-based rate limiter
│   ├── bay/
│   │   ├── razorpay.ts     # Order create, verify, refund
│   │   ├── settlement.ts   # GST/TCS/commission/payout engine
│   │   ├── email.ts        # Resend email templates
│   │   ├── data.ts         # Static product/seller data
│   │   └── auth-types.ts   # Shared auth types
│   └── utils.ts            # cn(), formatInr(), formatDate()
│
├── hooks/                  # React hooks (useCart, useAuth, useNotifications)
├── proxy.ts                # Edge middleware (auth + security headers)
├── middleware.ts           # Next.js middleware (delegates to proxy.ts)
└── env.ts                  # Type-safe environment variables (Zod)

prisma/
├── schema.prisma           # Data models & migrations
└── seed.ts                 # Database seeding script

public/                     # Static assets
```

---

## 🛡️ Security Highlights

✅ **CSRF Protection**: Double-submit cookies + SameSite strict
✅ **Content Security Policy**: Edge-enforced via `src/proxy.ts`
✅ **HSTS**: 1-year max-age with subdomains
✅ **Rate Limiting**: Per-endpoint, fingerprint-based client ID
✅ **Webhook Idempotency**: Event ID deduplication
✅ **Timing-Safe HMAC**: Razorpay signature verification
✅ **SQL Injection**: Prisma parameterized queries
✅ **IDOR Prevention**: Role + ownership checks on all routes

---

## 🤖 AI-Assisted Engineering Workflow

This project was built using **advanced AI-assisted development** as a force-multiplier for a solo engineer:

- **Models**: Z.ai GLM-5.2 (reasoning) + GPT-4o-class (generation)
- **Agent**: Hermes Agent (Nous Research) for pair programming, debugging, security audits
- **Approach**:
  - Architecture design + system planning
  - AI writes ~80% of boilerplate, validation, APIs, middleware
  - Engineer reviews, refines, integrates
  - Systematic security auditing (`SECURITY FIX` comments)
  - Real-time debugging & race condition identification

**Result**: 3–4 person team (backend, frontend, DevOps, security) compressed into 1 engineer + AI, without sacrificing code quality or observability.

---

## 📄 License

Proprietary — **BAY Maison**. All rights reserved.

---

<div align="center">

![BAY Maison Footer](https://github.com/iatharva28/bay-watch-marketplace/assets/placeholder/bay-footer.png)

### Built with precision. For the discerning few.

**Maison Horlogère — Founded 1947**  
*Mumbai, India*

</div>
