/**
 * BAY Marketplace — Database Seed Script
 *
 * Migrates the 12 products + 6 sellers from src/lib/bay/data.ts
 * into the PostgreSQL database. Also creates test users for each
 * role (customer, seller, admin) with known credentials.
 *
 * Run:  npx prisma db seed  (after npx prisma db push)
 *
 * Test accounts created:
 *   customer@test.com  / test1234  (role: customer)
 *   seller@test.com    / test1234  (role: seller, KYC verified)
 *   admin@test.com     / test1234  (role: admin)
 */

import { PrismaClient, UserRole, SellerType, KycStatus, ProductStatus, ProductCaseFinish, ProductComplicationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PRODUCTS, SELLERS, CATEGORIES, WATCHES } from "../src/lib/bay/data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding BAY Marketplace...\n");

  // ----------------------------------------------------------------
  // 1. Categories
  // ----------------------------------------------------------------
  console.log("📂 Creating categories...");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      },
    });
  }
  console.log(`   ✓ ${CATEGORIES.length} categories\n`);

  // ----------------------------------------------------------------
  // 2. Test Users (customer, seller, admin)
  // ----------------------------------------------------------------
  console.log("👥 Creating test users...");
  const passwordHash = await bcrypt.hash("test1234", 12);

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: {},
    create: {
      email: "customer@test.com",
      fullName: "Rajat Mehta",
      phone: "+91 98765 43210",
      passwordHash,
      role: UserRole.customer,
      emailVerified: new Date(),
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@test.com" },
    update: {},
    create: {
      email: "seller@test.com",
      fullName: "BAY Atelier",
      phone: "+91 22 6600 1234",
      passwordHash,
      role: UserRole.seller,
      emailVerified: new Date(),
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      fullName: "BAY Admin",
      phone: "+91 22 6600 0000",
      passwordHash,
      role: UserRole.admin,
      emailVerified: new Date(),
    },
  });
  console.log("   ✓ customer@test.com / test1234");
  console.log("   ✓ seller@test.com / test1234");
  console.log("   ✓ admin@test.com / test1234\n");

  // ----------------------------------------------------------------
  // 3. Sellers
  // ----------------------------------------------------------------
  console.log("🏪 Creating sellers...");
  const sellerMap: Record<string, string> = {}; // data.ts id → prisma seller id

  for (const s of SELLERS) {
    // Map own_brand seller to the seller test user, others get their own user
    const linkedUser = s.id === "bay-maison" ? sellerUser : await prisma.user.upsert({
      where: { email: `${s.id}@test.com` },
      update: {},
      create: {
        email: `${s.id}@test.com`,
        fullName: s.name,
        passwordHash,
        role: UserRole.seller,
        emailVerified: new Date(),
      },
    });

    const seller = await prisma.seller.upsert({
      where: { slug: s.id },
      update: {
        companyName: s.name,
        type: s.type as SellerType,
        city: s.city ?? null,
        established: s.established ?? null,
        specialty: s.specialty ?? null,
        verified: s.verified,
        bayAuthorized: s.bayAuthorized,
        commissionRate: s.commissionRate,
        rating: s.rating,
        reviewCount: s.reviewCount,
        story: s.story,
        // KYC for own_brand and authorized = verified, for vendors = verified (demo)
        kycStatus: KycStatus.verified,
        kycVerifiedAt: new Date(),
        panNumber: s.type === "own_brand" ? "BAYPM1234A" : `${s.id.toUpperCase().slice(0, 5)}P1234A`,
        gstin: s.type === "own_brand" ? "27BAYPM1234A1Z5" : `27${s.id.toUpperCase().slice(0, 5)}1234A1Z5`,
        bankAccountName: s.name,
        bankAccountNumber: "000123456789",
        bankIfsc: "HDFC0001234",
      },
      create: {
        userId: linkedUser.id,
        companyName: s.name,
        slug: s.id,
        type: s.type as SellerType,
        city: s.city ?? null,
        established: s.established ?? null,
        specialty: s.specialty ?? null,
        verified: s.verified,
        bayAuthorized: s.bayAuthorized,
        commissionRate: s.commissionRate,
        rating: s.rating,
        reviewCount: s.reviewCount,
        story: s.story,
        kycStatus: KycStatus.verified,
        kycVerifiedAt: new Date(),
        panNumber: s.type === "own_brand" ? "BAYPM1234A" : `${s.id.toUpperCase().slice(0, 5)}P1234A`,
        gstin: s.type === "own_brand" ? "27BAYPM1234A1Z5" : `27${s.id.toUpperCase().slice(0, 5)}1234A1Z5`,
        bankAccountName: s.name,
        bankAccountNumber: "000123456789",
        bankIfsc: "HDFC0001234",
      },
    });
    sellerMap[s.id] = seller.id;
  }
  console.log(`   ✓ ${SELLERS.length} sellers\n`);

  // ----------------------------------------------------------------
  // 4. Products
  // ----------------------------------------------------------------
  console.log("⌚ Creating products...");
  // Helper: convert kebab-case (from data.ts) to snake_case (for Prisma)
function toSnakeCase(str: string): string {
  return str.replace(/-/g, "_");
}
  for (const p of PRODUCTS) {
    const sellerId = sellerMap[p.sellerId];
    if (!sellerId) {
      console.warn(`   ⚠ Seller not found for product ${p.name}: ${p.sellerId}`);
      continue;
    }

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        ref: p.ref,
        name: p.name,
        sellerId,
        categoryId: p.categoryId,
        family: p.family,
        tagline: p.tagline,
        description: p.description,
        fullDescription: p.fullDescription,
        complication: p.complication,
        movement: p.movement,
        caseMaterial: p.caseMaterial,
        caseDiameter: p.caseDiameter,
        waterResistance: p.waterResistance,
        powerReserve: p.powerReserve,
        production: p.production,
        priceInr: p.priceInr,
        mrpInr: p.mrpInr ?? null,
        stock: p.stock,
        status: p.status as ProductStatus,
        year: p.year,
        dialColor: p.dialColor,
        caseFinish: toSnakeCase(p.caseFinish) as ProductCaseFinish,
        complicationType: toSnakeCase(p.complicationType) as ProductComplicationType,
        limited: p.limited ?? false,
        featured: p.featured ?? false,
        warrantyMonths: p.warrantyMonths,
        shipsInDays: p.shipsInDays,
        shippingInr: p.shippingInr,
      },
      create: {
        slug: p.slug,
        ref: p.ref,
        name: p.name,
        sellerId,
        categoryId: p.categoryId,
        family: p.family,
        tagline: p.tagline,
        description: p.description,
        fullDescription: p.fullDescription,
        complication: p.complication,
        movement: p.movement,
        caseMaterial: p.caseMaterial,
        caseDiameter: p.caseDiameter,
        waterResistance: p.waterResistance,
        powerReserve: p.powerReserve,
        production: p.production,
        priceInr: p.priceInr,
        mrpInr: p.mrpInr ?? null,
        stock: p.stock,
        status: p.status as ProductStatus,
        year: p.year,
        dialColor: p.dialColor,
        caseFinish: toSnakeCase(p.caseFinish) as ProductCaseFinish,
        complicationType: toSnakeCase(p.complicationType) as ProductComplicationType,
        limited: p.limited ?? false,
        featured: p.featured ?? false,
        warrantyMonths: p.warrantyMonths,
        shipsInDays: p.shipsInDays,
        shippingInr: p.shippingInr,
      },
    });

    // Create reviews if any
    for (const r of p.reviews) {
      const createdProduct = await prisma.product.findUnique({
        where: { slug: p.slug },
        select: { id: true },
      });
      if (!createdProduct) continue;

      await prisma.review.upsert({
        where: {
          productId_userId: {
            productId: createdProduct.id,
            userId: customerUser.id,
          },
        },
        update: {},
        create: {
          productId: createdProduct.id,
          userId: customerUser.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          verified: r.verified,
        },
      }).catch(() => {
        // Skip if already exists
      });
    }
  }
  console.log(`   ✓ ${PRODUCTS.length} products\n`);

  // ----------------------------------------------------------------
  // 5. Addresses for customer
  // ----------------------------------------------------------------
  console.log("📍 Creating addresses...");
  await prisma.address.upsert({
    where: { id: "addr-home" },
    update: {},
    create: {
      id: "addr-home",
      userId: customerUser.id,
      label: "home",
      fullName: "Rajat Mehta",
      phone: "+91 98765 43210",
      line1: "14 Cuffe Parade, Apt 1202",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400005",
      isDefault: true,
    },
  });
  console.log("   ✓ 2 addresses for customer@test.com\n");

  // ----------------------------------------------------------------
  // 6. Sample order
  // ----------------------------------------------------------------
  console.log("📦 Creating sample order...");
  const meridianProduct = await prisma.product.findUnique({
    where: { slug: "meridian-platinum" },
  });
  if (meridianProduct) {
    const orderNumber = `BAY-SEED-0001`;
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!existingOrder) {
      const subtotal = meridianProduct.priceInr;
      const gst = Math.round(subtotal - subtotal / 1.18);
      const tcs = Math.round(subtotal * 0.01);
      const total = subtotal + tcs;

      await prisma.order.create({
        data: {
          orderNumber,
          userId: customerUser.id,
          sellerId: meridianProduct.sellerId,
          status: "delivered",
          paymentStatus: "captured",
          subtotalInr: subtotal,
          gstInr: gst,
          tcsInr: tcs,
          shippingInr: 0,
          totalInr: total,
          commissionInr: 0, // own_brand = 0%
          gatewayFeeInr: Math.round(subtotal * 0.02),
          sellerPayoutInr: subtotal - Math.round(subtotal * 0.02) - tcs,
          paymentCapturedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          shippedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          shippingAddressId: "addr-home",
          items: {
            create: {
              productId: meridianProduct.id,
              name: meridianProduct.name,
              ref: meridianProduct.ref,
              priceInr: meridianProduct.priceInr,
              quantity: 1,
              sellerId: meridianProduct.sellerId,
              sellerName: "BAY Maison",
              commissionRate: 0,
              itemSubtotalInr: subtotal,
              itemCommissionInr: 0,
              itemGatewayFeeInr: Math.round(subtotal * 0.02),
              itemTcsInr: tcs,
              itemSellerPayoutInr: subtotal - Math.round(subtotal * 0.02) - tcs,
            },
          },
        },
      });
      console.log("   ✓ Sample order BAY-SEED-0001\n");
    }
  }

  console.log("✅ Seed complete!\n");
  console.log("Test accounts:");
  console.log("  Customer: customer@test.com / test1234");
  console.log("  Seller:   seller@test.com / test1234");
  console.log("  Admin:    admin@test.com / test1234");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
