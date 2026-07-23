import { z } from "zod";

/**
 * BAY Validation Schemas
 *
 * Zod schemas for all user-facing inputs. Used by both client
 * components (for immediate feedback) and API routes (for
 * server-side validation — never trust the client).
 */

// ---- Shop search params ----
export const ShopSearchParamsSchema = z.object({
  q: z.string().trim().max(200).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest"]).optional(),
  categories: z.array(z.string().max(50)).max(10).optional(),
  sellers: z.array(z.string().max(50)).max(10).optional(),
  sellerTypes: z
    .array(z.enum(["own_brand", "authorized", "vendor"]))
    .max(3)
    .optional(),
  priceRange: z
    .enum(["all", "under-5l", "5l-1cr", "1cr-5cr", "above-5cr"])
    .optional(),
  inStockOnly: z.coerce.boolean().optional(),
});

export type ShopSearchParams = z.infer<typeof ShopSearchParamsSchema>;

// ---- Auth ----
export const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  role: z.enum(["customer", "seller", "admin"]).optional(),
});

export const RegisterSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s-]{10,15}$/)
    .optional(),
  password: z.string().min(8).max(128),
  role: z.enum(["customer", "seller"]),
  company: z.string().trim().max(200).optional(),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .optional(),
});

// ---- Checkout ----
export const ShippingAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s-]{10,15}$/),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/),
  notes: z.string().trim().max(500).optional(),
});

// ---- Cart operations ----
export const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).optional(),
});

// ---- Product creation (seller) ----
export const ProductCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  ref: z.string().trim().min(2).max(50),
  family: z.string().trim().min(2).max(100),
  tagline: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(2000),
  complication: z.string().trim().min(2).max(200),
  movement: z.string().trim().min(2).max(200),
  caseMaterial: z.string().trim().min(2).max(100),
  caseDiameter: z.string().trim().min(2).max(50),
  waterResistance: z.string().trim().min(2).max(50),
  powerReserve: z.string().trim().min(2).max(50),
  production: z.string().trim().min(2).max(50),
  priceInr: z.number().int().min(10000).max(1000000000), // ₹100 to ₹1Cr in paise
  stock: z.number().int().min(0).max(999),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  dialColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  caseFinish: z.enum([
    "polished-platinum",
    "brushed-steel",
    "sandblasted-titanium",
    "obsidian-ceramic",
  ]),
  complicationType: z.enum([
    "time-only",
    "tourbillon",
    "perpetual-calendar",
    "minute-repeater",
    "gmt",
    "chronograph",
    "diver",
    "ultra-thin",
    "skeleton",
    "grand-sonnerie",
    "astrological",
    "grand-complication",
  ]),
  warrantyMonths: z.number().int().min(1).max(120),
  shipsInDays: z.number().int().min(0).max(90),
});

/** Safe parse that always returns a value (falls back to defaults) */
export function safeParseSearchParams(
  params: Record<string, string | string[] | undefined>
): ShopSearchParams {
  const result = ShopSearchParamsSchema.safeParse(params);
  if (result.success) return result.data;
  return {};
}
