import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

/**
 * NextAuth Type Augmentation
 *
 * Adds `role` and `sellerId` to the session user and JWT so they're
 * available via useSession() on the client and getServerSession() on
 * the server — without a DB lookup on every request.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "seller" | "admin";
      sellerId: string | null;
      fullName?: string | null;
      phone?: string | null;
      createdAt?: Date | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: "customer" | "seller" | "admin";
    sellerId?: string | null;
    fullName?: string;
    phone?: string | null;
    createdAt?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: "customer" | "seller" | "admin";
    sellerId?: string | null;
    fullName?: string | null;
    phone?: string | null;
    createdAt?: Date | null;
  }
}
