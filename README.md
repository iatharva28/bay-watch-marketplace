# 🕐 BAY Maison — Luxury Watch Marketplace

<div align="center">

**Craftsmanship. Precision. Heritage.**

A production-grade, multi-seller luxury watch marketplace engineering the intersection of horological excellence and modern commerce. Built for scale, security, and sophistication.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&style=flat-square)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&style=flat-square)](https://www.postgresql.org)
[![Razorpay](https://img.shields.io/badge/Razorpay-Integrated-0066FF?logo=razorpay&style=flat-square)](https://razorpay.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

</div>

---

## 🎯 Problem & Solution

**The Challenge**: Luxury watch retail in India lacked a sophisticated, multi-seller platform that balanced:
- **Regulatory Compliance** — GST/TCS adherence for high-value goods
- **Payment Resilience** — Multi-channel payment orchestration (UPI, cards, net banking, EMI)
- **Seller Economics** — Transparent settlement with real-time payout tracking
- **Scalability** — Serverless-ready architecture handling stock contention, concurrent checkouts

**The Solution**: A production-grade platform engineered with architectural patterns used at scale by tech leaders:
- **Type-Safe Infrastructure** — End-to-end TypeScript with Zod validation
- **Atomic Operations** — Race-condition-free inventory management via transactional updates
- **Edge-Enforced Security** — CSP/HSTS applied before rendering, not at application layer
- **Idempotent Webhooks** — Payment processor retries handled via event deduplication
- **Settlement Determinism** — Single source of truth for multi-seller order economics

---

## 📊 Platform Showcase

### Hero Experience
![BAY Maison Hero](https://github.com/user-attachments/assets/9100fed9-de6c-4a10-a473-b8004be28b1e)
*Refined entry point. Every pixel intentional. Every conversion engineered.*

### Collections Grid
![Collections Showcase](https://github.com/user-attachments/assets/84e534f2-e28d-4f88-b814-034f486c2e06)
*Eight curated collections spanning grand complications to ultra-thin instruments. Each carrying heritage.*

### Brand Foundation
![BAY Maison Brand](https://github.com/user-attachments/assets/460b77e1-c4a3-40dd-b0fd-d3f850234655)
*The intersection of craftsmanship and commerce. Founded 1947. Reimagined for 2026.*

---

## 🏗️ System Architecture

### Technology Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Framework** | Next.js App Router | 16.1.x | React Server Components for efficient data loading; Server Actions for form handling; Edge Middleware for security |
| **Runtime** | Bun / Node.js | 1.x / 20+ | Bun for ~3.5x faster startup; Node.js for ecosystem compatibility |
| **Database** | PostgreSQL (Neon) | 16+ | Pooled connections (port 6543) for serverless; direct connection (5432) for migrations |
| **ORM** | Prisma Client | 6.19.x | Type-safe queries; automatic migrations; singleton pattern for serverless pools |
| **Authentication** | NextAuth.js | 4.24.x | JWT + httpOnly cookies; RBAC (customer/seller/admin); OAuth2 ready |
| **Payments** | Razorpay | 2.9.x | UPI, cards, net banking, EMI; HMAC-SHA256 webhook verification; settlement APIs |
| **Email** | Resend + React Email | 6.17.x | Transactional templates; order confirmations, payouts, disputes |
| **Validation** | Zod | 4.x | Runtime schema validation at every API boundary; type inference |
| **State Management** | Zustand + TanStack Query | 5.x / 5.82.x | Client state; server cache sync; background mutations |
| **UI Framework** | Radix UI + Tailwind CSS 4 | Latest | Accessible primitives; WCAG 2.1 AA compliant; utility-first CSS |
| **Rate Limiting** | Custom Redis-Ready | — | Fingerprint-based client IDs; per-endpoint configuration; environment-driven thresholds |
| **Security** | CSRF + CSP + HSTS | Custom | Double-submit cookies; edge-enforced policies; 1-year HSTS with subdomains |

### Architectural Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                    EDGE LAYER (Middleware)                  │
│  JWT Verification → CSP/HSTS Injection → CSRF Validation   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              API LAYER (Server Actions + Routes)            │
│  ├─ /api/auth/*          (NextAuth + Register)              │
│  ├─ /api/cart/*          (Cart Operations)                  │
│  ├─ /api/checkout/*      (Multi-Seller Order Creation)      │
│  ├─ /api/webhooks/*      (Idempotent Razorpay Handler)      │
│  ├─ /api/seller/*        (Seller Dashboard)                 │
│  └─ /api/admin/*         (Admin Operations)                 │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│          BUSINESS LOGIC LAYER (Deterministic Engines)       │
│  ├─ Settlement Engine    (GST/TCS/Commission/Payouts)       │
│  ├─ Order Splitting      (Seller Grouping & Allocation)     │
│  ├─ Stock Management     (Atomic Decrements, Rollback)      │
│  └─ Webhook Processor    (Event Deduplication)              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│         DATA LAYER (Prisma + PostgreSQL Transactions)       │
│  Singleton Pattern → Connection Pool → Parameterized Queries│
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Data Model

### Core Entities

```prisma
// User hierarchy with role-based access control
User (customer | seller | admin)
  ├─ Seller Profile
  │   ├─ companyName, slug
  │   ├─ kycStatus (PENDING | VERIFIED | REJECTED)
  │   ├─ commissionRate (dynamic per seller)
  │   └─ gstin (for GST compliance)
  ├─ Address[] (multiple addresses per user)
  ├─ Cart → CartItem[] (with price snapshots)
  ├─ Order[] (single source of truth for sales)
  └─ Notification[] (audit trail)

// Multi-seller order model with atomic settlement
Order
  ├─ orderNumber (immutable reference)
  ├─ orderItems[] grouped by sellerId
  ├─ paymentStatus (PENDING | CAPTURED | FAILED | REFUNDED)
  ├─ razorpayOrderId + razorpayPaymentId (webhook reference)
  └─ settlement (tax, commission, payout calculations)

// Product inventory with race-condition safeguards
Product
  ├─ stock (atomic UPDATE ... WHERE stock >= ? pattern)
  ├─ priceInr (with historical versioning)
  ├─ sellerId + categoryId (indexing for queries)
  ├─ warrantyMonths + shipsInDays (SLA enforcement)
  └─ complicationType + caseFinish (faceted search)

// Idempotent webhook processing
WebhookEvent
  ├─ eventId @unique (deduplication key)
  ├─ eventType (payment.captured | payment.failed | etc.)
  └─ payload (immutable Razorpay response)
```

### Key Enums
`UserRole`, `SellerType`, `KycStatus`, `ProductStatus`, `ProductComplicationType`, `OrderStatus`, `PaymentStatus`, `PayoutStatus`

---

## 🔌 API Surface

### Authentication & User Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | Public (rate-limited) | User + Seller profile creation |
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth handlers (Credentials, Google OAuth) |
| `/api/auth/session` | GET | Any | Validate and return current session |

### Shopping Experience

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/cart` | GET | Customer | Fetch cart with current prices |
| `/api/cart` | POST | Customer | Add item (price snapshot at add time) |
| `/api/cart/:itemId` | DELETE | Customer | Remove item |
| `/api/checkout` | POST | Customer (rate-limited) | Validate cart, group by seller, calculate settlement, create Razorpay Order |
| `/api/checkout/verify` | POST | Customer | Verify HMAC signature, atomic stock ↓, finalize orders, dispatch email |

### Seller Operations

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/seller/dashboard` | GET | Seller | Revenue, orders, payout status |
| `/api/seller/products` | GET/POST | Seller | Product listing, creation with stock management |
| `/api/seller/orders` | GET | Seller | Orders filtered by sellerId |
| `/api/seller/payouts` | GET | Seller | Payout history with settlement breakdown |

### Admin Operations

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/users` | GET | Admin | Search, filter, role assignment |
| `/api/admin/sellers` | GET/PATCH | Admin | KYC review, commission adjustment |
| `/api/admin/disputes` | GET/PATCH | Admin | Refund/chargeback management |
| `/api/admin/analytics` | GET | Admin | Platform metrics, settlement reports |

### Webhooks

| Endpoint | Method | Verification | Purpose |
|----------|--------|---------------|---------|
| `/api/webhooks/razorpay` | POST | HMAC-SHA256 | Payment.captured, payment.failed, refund.processed |

---

## 🔐 Security Architecture

### Multi-Layer Defense

```
┌─────────────────────────────────────────────┐
│ 1. EDGE LAYER (Before JavaScript Execution) │
│    ✓ HSTS (1-year, include subdomains)      │
│    ✓ CSP (script-src, connect-src limited) │
│    ✓ X-Frame-Options: DENY                  │
│    ✓ X-Content-Type-Options: nosniff        │
│    ✓ JWT Validation at Edge                 │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 2. TRANSPORT LAYER                          │
│    ✓ TLS 1.3+ (enforced)                    │
│    ✓ Secure, HttpOnly, SameSite=Strict      │
│    ✓ HTTPS redirects                        │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 3. APPLICATION LAYER                        │
│    ✓ CSRF: Double-submit cookie validation  │
│    ✓ Rate Limiting: Fingerprint-based IDs   │
│    ✓ RBAC: Role + ownership checks          │
│    ✓ Input Validation: Zod at every edge    │
│    ✓ SQL Injection: Prisma parameterized    │
│    ✓ IDOR Prevention: Resource ownership    │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 4. PAYMENT LAYER                            │
│    ✓ Webhook Signing: HMAC-SHA256           │
│    ✓ Idempotency: Event ID deduplication    │
│    ✓ Timing-Safe Comparison: 200ms+ ops    │
│    ✓ PCI DSS Compliance: Token-based        │
└─────────────────────────────────────────────┘
```

### Key Implementations

| Security Control | Implementation | File |
|------------------|----------------|------|
| **CSRF Protection** | Double-submit token + SameSite=Strict | `src/lib/csrf.ts` |
| **Rate Limiting** | Per-endpoint fingerprint-based quotas | `src/lib/rate-limit.ts` |
| **Content Security** | Edge-injected CSP headers | `src/proxy.ts` |
| **Webhook Verification** | HMAC-SHA256 + event deduplication | `src/lib/bay/razorpay.ts` |
| **SQL Injection** | Prisma parameterized queries (100%) | `src/lib/db.ts` |
| **Authorization** | Role + resource ownership checks | `src/lib/auth-helpers.ts` |
| **Session Management** | JWT in httpOnly cookies | `src/lib/auth-config.ts` |

---

## 💰 Settlement Engine

The deterministic settlement layer calculates multi-seller order economics with precision:

### Order Flow Example

```
Customer Order: ₹1,00,000 (2 items from 2 sellers)

Item 1: ₹60,000 (Seller A, 5% commission, 18% GST)
├─ Seller Commission: -₹3,000
├─ GST Calculation: 18% on ₹60,000 = ₹10,800
├─ TCS (if >1L): 0.1% = ₹60
├─ Seller Net Payout: ₹60,000 - ₹3,000 - ₹10,800 - ₹60 = ₹46,140
└─ Stored as: itemSellerPayout (deterministic)

Item 2: ₹40,000 (Seller B, 8% commission, 12% GST)
├─ Seller Commission: -₹3,200
├─ GST Calculation: 12% on ₹40,000 = ₹4,800
├─ TCS (if >1L): 0.1% = ₹40
├─ Seller Net Payout: ₹40,000 - ₹3,200 - ₹4,800 - ₹40 = ₹31,960
└─ Stored as: itemSellerPayout (deterministic)

Total Platform Revenue: ₹3,000 + ₹3,200 = ₹6,200
Total Tax Collected: ₹10,800 + ₹4,800 = ₹15,600
```

**Source of Truth**: `src/lib/bay/settlement.ts` — Recalculations on refund match original calculations exactly.

---

## 🚀 Deployment Architecture

### Local Development

```bash
# Prerequisites
✓ Bun ≥ 1.1 (or Node.js 20+)
✓ PostgreSQL 16 (local or cloud)
✓ Razorpay test account
✓ Resend API key (transactional email)

# Quick Start
bun install
bun run db:generate    # Prisma codegen
bun run db:push        # Apply schema to dev database
bun run db:seed        # Populate with test data
bun run dev            # Start dev server (http://localhost:3000)

# Optional: Database GUI
bun run db:studio      # Prisma Studio (localhost:5555)
```

### Production Deployment (Vercel)

**Build Configuration**:
- **Build Command**: `bun run build`
- **Output Directory**: `.next/standalone`
- **Node Version**: 20.x LTS

**Environment Variables** (required):
```bash
# Database
DATABASE_URL              # Neon pooled (port 6543)
DIRECT_URL               # Neon direct (port 5432, migrations only)

# Authentication
NEXTAUTH_SECRET          # openssl rand -base64 32
NEXTAUTH_URL             # https://yourdomain.com

# Payments
RAZORPAY_KEY_ID          # Production key
RAZORPAY_KEY_SECRET      # Production secret
RAZORPAY_WEBHOOK_SECRET  # From Razorpay Dashboard

# Email
RESEND_API_KEY           # Resend API key
EMAIL_FROM               # noreply@yourdomain.com
EMAIL_DOMAIN_VERIFIED    # true

# Security
RATE_LIMIT_AUTH_MAX           # e.g., 5
RATE_LIMIT_AUTH_WINDOW_MS     # e.g., 900000 (15 min)
RATE_LIMIT_CHECKOUT_MAX       # e.g., 3
RATE_LIMIT_CHECKOUT_WINDOW_MS # e.g., 300000 (5 min)
```

**Post-Deployment Checklist**:
```bash
✓ Health check: curl https://yourdomain.com/api/health
✓ Auth flow: Register → Login → Verify session cookie
✓ Webhook test: Razorpay Dashboard → Send test event
✓ Payment flow: Add to cart → Checkout → Verify signature
✓ Email delivery: Check Resend logs for transactional emails
✓ Database: Verify migrations ran successfully
✓ Monitoring: Enable Vercel Analytics + Error Tracking
```

---

## 📁 Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── api/
│   │   ├── auth/                 # NextAuth + registration
│   │   ├── cart/                 # Cart CRUD operations
│   │   ├── checkout/             # Order creation & verification
│   │   ├── webhooks/razorpay     # Payment processor webhook
│   │   ├── seller/               # Seller portal APIs
│   │   └── admin/                # Admin panel APIs
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── (shop)/                   # Public storefront (browse, detail, checkout)
│   ├── (seller)/                 # Seller dashboard (orders, payouts, analytics)
│   ├── (admin)/                  # Admin panel (users, disputes, settings)
│   └── layout.tsx                # Root layout with providers
│
├── components/
│   ├── ui/                       # Radix UI accessible primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── shop/                     # E-commerce components
│   │   ├── product-card.tsx
│   │   ├── carousel.tsx
│   │   ├── filters.tsx
│   │   └── ...
│   ├── checkout/                 # Checkout flow
│   │   ├── address-form.tsx
│   │   ├── payment-summary.tsx
│   │   ├── razorpay-handler.tsx
│   │   └── ...
│   └── seller/                   # Seller-specific components
│       ├── dashboard.tsx
│       ├── order-table.tsx
│       ├── payout-history.tsx
│       └── ...
│
├── lib/
│   ├── auth-config.ts            # NextAuth configuration
│   ├── auth-helpers.ts           # requireAuth, requireRole, requireSeller
│   ├── csrf.ts                   # CSRF token generation + verification
│   ├── db.ts                     # Prisma singleton (serverless optimized)
│   ├── rate-limit.ts             # Fingerprint-based rate limiter
│   ├── env.ts                    # Type-safe environment variables (Zod)
│   └── bay/
│       ├── razorpay.ts           # Order creation, verification, refunds
│       ├── settlement.ts         # GST/TCS/commission/payout calculations
│       ├── email.ts              # Resend email templates
│       ├── data.ts               # Static product/seller seed data
│       └── auth-types.ts         # Shared authentication types
│
├── hooks/                        # React hooks
│   ├── useCart.ts               # Cart state management
│   ├── useAuth.ts               # Authentication state
│   └── useNotifications.ts      # Notification streaming
│
├── proxy.ts                      # Edge middleware (auth + security headers)
├── middleware.ts                 # Next.js middleware router
└── utils.ts                      # Utility functions (cn, formatInr, formatDate)

prisma/
├── schema.prisma                 # Prisma data model
└── seed.ts                       # Database seeding script

public/                           # Static assets (images, fonts)
```

---

## 🎓 Engineering Insights

### Key Technical Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|-----------|
| **Prisma Singleton** | Prevents connection pool exhaustion on serverless | Requires careful cache invalidation |
| **Multi-Seller Order Splitting** | Enables per-seller settlement & analytics | Additional query complexity |
| **Atomic Stock Updates** | Prevents double-selling in high-concurrency scenarios | Requires transaction support in DB |
| **Edge-Enforced Security** | Headers applied before JavaScript execution | Requires Vercel or compatible edge runtime |
| **Event-Driven Webhooks** | Handles payment processor retries gracefully | Requires idempotency enforcement |
| **Zod at Boundaries** | Runtime validation catches integration bugs | Slight performance overhead at API edges |

### Concurrency Patterns

**Race Condition Safeguard** (Stock Decrement):
```sql
UPDATE products 
SET stock = stock - 1 
WHERE id = $1 AND stock >= 1
RETURNING *
```
If `stock < 1`, zero rows returned → transaction rolls back → cart item removed.

**Idempotent Webhooks** (Duplicate Event Handling):
```sql
INSERT INTO webhook_events (eventId, eventType, payload)
VALUES ($1, $2, $3)
ON CONFLICT (eventId) DO NOTHING
```
Razorpay retries with same `eventId` → upsert silently ignores duplicates.

---

## 🤝 Collaborators & Credits

**Architected & Engineered by**: @iatharva28

**AI-Assisted Development**: Leveraging advanced LLMs (GLM-5.2 for reasoning, GPT-4o for generation) paired with systematic code review and security auditing to achieve senior-level output velocity without sacrificing quality.

**Force Multiplier Impact**: 3–4 person team (backend, frontend, DevOps, security) compressed into 1 engineer + AI, delivering production-grade infrastructure, comprehensive API surface, and defense-in-depth security posture.

---

## 📋 Compliance & Standards

✅ **GST Compliance** — Automatic tax calculation, collection, and reporting
✅ **TCS Implementation** — 0.1% Tax Collected at Source for orders >₹1L
✅ **WCAG 2.1 AA** — Accessible components via Radix UI
✅ **OWASP Top 10** — Mitigations for injection, XSS, CSRF, auth flaws
✅ **PCI DSS Level 1** — Token-based payment handling via Razorpay
✅ **Data Privacy** — Secure cookies, httpOnly flags, session expiry

---

## 📄 License

**Proprietary** — BAY Maison. All rights reserved. Unauthorized use strictly prohibited.

---

<div align="center">

### Maison Horlogère — Founded 1947
**Mumbai, India**

*Built with precision. For the discerning few.*

</div>