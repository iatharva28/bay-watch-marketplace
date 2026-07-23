import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/providers/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BAY — Quiet Luxury. Timeless Precision.",
  description:
    "BAY is a modern Swiss-inspired watch maison. Mechanical excellence, timeless design, and quiet luxury for collectors who value precision over proclamation.",
  keywords: [
    "BAY",
    "luxury watches",
    "Swiss watches",
    "tourbillon",
    "perpetual calendar",
    "mechanical watches",
    "watch collector",
    "haute horlogerie",
    "maison",
  ],
  authors: [{ name: "BAY Maison" }],
  openGraph: {
    title: "BAY — Quiet Luxury. Timeless Precision.",
    description:
      "An immersive digital flagship for BAY, a modern Swiss-inspired watch maison.",
    siteName: "BAY",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inline script — runs before first paint to apply the saved theme.
  // Prevents flash-of-wrong-theme (FOUC). Default is dark (Glacier Noir).
  const themeScript = `
    (function() {
      try {
        var saved = localStorage.getItem('bay-theme');
        if (saved === 'light') {
          document.documentElement.classList.add('light');
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${cormorant.variable} ${jetbrains.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
