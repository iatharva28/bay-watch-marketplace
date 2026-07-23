"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";

/**
 * NextAuth SessionProvider — wraps the app so useSession() works
 * on every client component. Must be a Client Component itself.
 */
export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
