/**
 * BAY Auth Types
 *
 * SECURITY FIX (C2): Removed the insecure `bay-auth` cookie store that was
 * client-writable (no httpOnly, secure, or signed flags). Any XSS vulnerability
 * would allow full account takeover.
 *
 * This file now only exports shared type definitions. The actual auth state
 * is managed by NextAuth via httpOnly session cookies.
 */

export type UserRole = "customer" | "seller" | "admin";

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  company?: string;
  gstin?: string;
  createdAt: string;
};