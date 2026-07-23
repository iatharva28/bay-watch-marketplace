import { PrismaClient } from "@prisma/client";

/**
 * BAY Database Client
 *
 * Prisma client with global caching to prevent connection pool
 * exhaustion on serverless (Vercel). Each hot-reload in dev creates
 * a new PrismaClient — this cache prevents that.
 *
 * Production: Neon serverless driver handles pooling automatically.
 * The DATABASE_URL must be the pooled connection string (port 6543).
 * The DIRECT_URL must be the direct connection (port 5432) for migrations.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
