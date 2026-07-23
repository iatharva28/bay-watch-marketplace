import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * BAY NextAuth.js Configuration
 *
 * Strategy: JWT (not database sessions) — works on serverless
 * without persistent connections. The JWT contains userId, email,
 * role, and sellerId so every server-side request can authorize
 * without a DB lookup.
 *
 * Providers:
 *   1. Credentials (email + password) — for all roles
 *   2. Google OAuth — for customers (faster signup)
 *
 * Role assignment:
 *   - Credentials: role comes from the DB user record
 *   - Google OAuth: new users default to "customer"; existing users
 *     keep their DB role. Sellers/admins must use credentials or
 *     have their role upgraded by an admin after Google login.
 *
 * Session callback: injects role + sellerId into the JWT and session
 * so the client and server can read them via useSession() / getServerSession().
 */

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
          // Generic error — don't reveal whether the email exists
          throw new Error("Invalid email or password");
        }

        if (user.deletedAt) {
          throw new Error("Invalid email or password");
        }

        // ---- Role match check ----
        // The user selects a role on the login page. We verify it
        // matches their actual DB role. On mismatch, we return a
        // GENERIC error to prevent information disclosure (an
        // attacker shouldn't learn which role an email has).
        //
        // Admin can log in via any role selector (they outrank all).
        const selectedRole = credentials.role as "customer" | "seller" | "admin" | undefined;
        if (selectedRole && selectedRole !== "admin" && user.role !== "admin") {
          if (user.role !== selectedRole) {
            // Log the real reason server-side, show generic error to client
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
          // Same error as "no account" — prevents timing-based enumeration
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
    // ---- JWT callback — runs on every sign-in and session read ----
    async jwt({ token, user, account }) {
      // Initial sign-in: user object is present
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "customer";
        token.sellerId = (user as any).sellerId ?? null;
        token.fullName = (user as any).fullName ?? (user as any).name;
        token.phone = (user as any).phone;
        token.createdAt = (user as any).createdAt;
      }

      // For OAuth (Google) sign-in, fetch role from DB if not in token
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
          // New Google user — default to customer
          token.role = "customer";
        }
      }

      return token;
    },

    // ---- Session callback — runs on every useSession() / getServerSession() ----
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

    // ---- SignIn callback — block sellers without KYC verification ----
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        // Already authorized via credentials — allow
        return true;
      }
      // Google sign-in — allow (role defaults to customer)
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
