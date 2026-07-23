import { NextRequest, NextResponse } from "next/server";

/**
 * BAY Rate Limiter — Production-ready with dev-friendly defaults
 *
 * Design principles:
 * 1. Configuration via environment variables for dev/prod parity
 * 2. Reliable client identification (IP + fallback to session/UA hash)
 * 3. In-memory store survives hot reloads via globalThis (Next.js dev server)
 * 4. Structured logging for observability
 * 5. Zero external deps for MVP; Redis-ready interface for Phase 2
 */

// ============================================================================
// Configuration — Environment-driven for dev/prod parity
// ============================================================================

const isDevelopment = process.env.NODE_ENV === "development";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Generous defaults for local development; strict for production
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  register: {
    maxRequests: isDevelopment ? 50 : 3,
    windowMs: isDevelopment ? 60_000 : 5 * 60_000, // 1 min dev / 5 min prod
  },
  login: {
    maxRequests: isDevelopment ? 30 : 5,
    windowMs: 60_000, // 1 minute
  },
  checkout: {
    maxRequests: isDevelopment ? 20 : 5,
    windowMs: 10 * 60_000, // 10 minutes
  },
  api: {
    maxRequests: isDevelopment ? 500 : 100,
    windowMs: 60_000,
  },
  passwordReset: {
    maxRequests: isDevelopment ? 10 : 3,
    windowMs: 60 * 60_000, // 1 hour
  },
};

// Allow env override per endpoint: RATE_LIMIT_REGISTER_MAX=10 RATE_LIMIT_REGISTER_WINDOW_MS=60000
function getConfig(group: string): RateLimitConfig {
  const prefix = `RATE_LIMIT_${group.toUpperCase()}`;
  const maxRequests = parseInt(process.env[`${prefix}_MAX`] || "", 10);
  const windowMs = parseInt(process.env[`${prefix}_WINDOW_MS`] || "", 10);
  const defaults = DEFAULT_CONFIGS[group] ?? DEFAULT_CONFIGS.api;

  return {
    maxRequests: Number.isFinite(maxRequests) && maxRequests > 0 ? maxRequests : defaults.maxRequests,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : defaults.windowMs,
  };
}

// ============================================================================
// Client Identification — Reliable across dev/prod
// ============================================================================

/**
 * Generates a stable client identifier.
 * Priority: x-forwarded-for > x-real-ip > hashed(user-agent + accept-language) > "unknown"
 * In development, falls back to a session-like ID based on headers to avoid
 * all localhost traffic sharing the "unknown" bucket.
 */
function getClientIdentifier(request: NextRequest): string {
  // 1. Standard proxy headers (production/Vercel)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0].trim()}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  // 2. Development fallback: hash of User-Agent + Accept-Language
  // This gives each browser/device a distinct bucket on localhost
  if (isDevelopment) {
    const ua = request.headers.get("user-agent") || "";
    const lang = request.headers.get("accept-language") || "";
    const hash = simpleHash(`${ua}|${lang}`);
    return `dev:${hash}`;
  }

  // 3. Production fallback (shouldn't happen on Vercel)
  return "unknown";
}

/** Simple FNV-1a hash for stable identifier generation */
function simpleHash(str: string): string {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Return as short hex string
  return (hash >>> 0).toString(16).substring(0, 8);
}

// ============================================================================
// Persistent In-Memory Store — Survives Hot Reloads via globalThis
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Use globalThis to persist across Next.js hot reloads in development
// In production (Vercel), each invocation is stateless anyway — Redis is Phase 2
declare global {
  var __bay_rate_limit_store__: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore: Map<string, RateLimitEntry> = globalThis.__bay_rate_limit_store__ ?? new Map();

if (!globalThis.__bay_rate_limit_store__) {
  globalThis.__bay_rate_limit_store__ = rateLimitStore;
}

// Periodic cleanup of expired entries (runs once per process)
if (typeof globalThis.__bay_rate_limit_cleanup_started__ === "undefined") {
  globalThis.__bay_rate_limit_cleanup_started__ = true;
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of Array.from(rateLimitStore.entries())) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0 && isDevelopment) {
      console.log(`[rate-limit] Cleaned ${cleaned} expired entries (${rateLimitStore.size} active)`);
    }
  }, 60_000); // Every minute
}

// ============================================================================
// Core Rate Limiter
// ============================================================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Checks and increments the rate limit counter.
 * Returns null if allowed, NextResponse with 429 if limited.
 */
export function createRateLimiter(group: string) {
  const config = getConfig(group);

  return function rateLimit(
    request: NextRequest,
    customIdentifier?: string
  ): NextResponse | null {
    const identifier = customIdentifier ?? getClientIdentifier(request);
    const key = `${group}:${identifier}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Log structured info in development
    if (isDevelopment) {
      console.log(
        `[rate-limit] check group="${group}" id="${identifier}" key="${key}" count=${entry?.count ?? 0}/${config.maxRequests} remaining=${Math.max(0, config.maxRequests - (entry?.count ?? 0))} resetIn=${entry ? Math.ceil((entry.resetAt - now) / 1000) : "N/A"}s`
      );
    }

    // First request or window expired — start fresh window
    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return null; // Allowed
    }

    // Increment counter
    entry.count++;

    const remaining = Math.max(0, config.maxRequests - entry.count);

    // Exceeded limit
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      if (isDevelopment) {
        console.warn(
          `[rate-limit] BLOCKED group="${group}" id="${identifier}" count=${entry.count}/${config.maxRequests} retryAfter=${retryAfter}s`
        );
      }

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    // Allowed — attach headers for client visibility
    return null;
  };
}

// ============================================================================
// Pre-configured Limiters (import these in route handlers)
// ============================================================================

export const rateLimiters = {
  register: createRateLimiter("register"),
  login: createRateLimiter("login"),
  checkout: createRateLimiter("checkout"),
  api: createRateLimiter("api"),
  passwordReset: createRateLimiter("passwordReset"),
};

// ============================================================================
// Utilities for testing/admin
// ============================================================================

/** Reset all rate limit state (useful for E2E tests) */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
  if (isDevelopment) {
    console.log("[rate-limit] Store manually cleared");
  }
}

/** Get current store stats (debugging) */
export function getRateLimitStats(): { size: number; groups: Record<string, number> } {
  const groups: Record<string, number> = {};
  for (const [key] of Array.from(rateLimitStore.entries())) {
    const group = key.split(":")[0];
    groups[group] = (groups[group] ?? 0) + 1;
  }
  return { size: rateLimitStore.size, groups };
}