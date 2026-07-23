import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.js API route — handles /api/auth/*
 * (signin, signout, session, csrf, providers, callback)
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
