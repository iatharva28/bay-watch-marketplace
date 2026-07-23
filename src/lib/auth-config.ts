/**
 * BAY NextAuth Configuration — Shared between API routes and Middleware
 *
 * This file is separate from auth.ts to avoid circular imports and
 * to be importable by middleware (which has different module resolution).
 */
import type { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // customer | seller | admin
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { seller: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        if (user.deletedAt) {
          throw new Error("Invalid email or password");
        }

        // Role match check
        const selectedRole = credentials.role as
          | "customer"
          | "seller"
          | "admin"
          | undefined;
        if (selectedRole && selectedRole !== "admin" && user.role !== "admin") {
          if (user.role !== selectedRole) {
            console.warn(
              `Role mismatch: ${credentials.email} is ${user.role}, tried to log in as ${selectedRole}`
            );
            throw new Error("Invalid email or password");
          }
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          sellerId: user.seller?.id ?? null,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "customer";
        token.sellerId = (user as any).sellerId ?? null;
        token.fullName = (user as any).fullName ?? (user as any).name;
        token.phone = (user as any).phone;
        token.createdAt = (user as any).createdAt;
      }

      if (account?.provider === "google" && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email! },
          include: { seller: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.sellerId = dbUser.seller?.id ?? null;
          token.fullName = dbUser.fullName;
          token.phone = dbUser.phone;
          token.createdAt = dbUser.createdAt;
        } else {
          token.role = "customer";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.fullName as string | undefined;
        session.user.email = token.email as string | undefined;
        session.user.role = token.role as "customer" | "seller" | "admin";
        session.user.sellerId = (token.sellerId as string | null) ?? null;
        (session.user as any).fullName = token.fullName;
        (session.user as any).phone = token.phone;
        (session.user as any).createdAt = token.createdAt;
      }
      return session;
    },

    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true;
      }
      return true;
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export type UserRole = "customer" | "seller" | "admin";

export const ROLE_LEVEL: Record<UserRole, number> = {
  customer: 1,
  seller: 2,
  admin: 3,
};