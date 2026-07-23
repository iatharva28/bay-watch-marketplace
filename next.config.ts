import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Re-enabled — TypeScript errors now block production builds.
  typescript: {
    ignoreBuildErrors: false,
  },
  // Re-enabled — catches useEffect double-invocation bugs in dev.
  reactStrictMode: true,
  // Allow the preview domain to access Next.js dev resources
  allowedDevOrigins: ["*.space-z.ai"],
  
  // SECURITY FIX (M1): Add security headers to all responses
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Enable XSS protection (legacy but harmless)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser features
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Enforce HTTPS (includes subdomains, preload for HSTS list)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          // Additional API-specific headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  
  // CSP is handled by middleware (src/proxy.ts) for more granular control
  // over allowed sources (Razorpay, Google Fonts, etc.)
};

export default nextConfig;