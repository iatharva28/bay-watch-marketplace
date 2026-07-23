"use client";

import MarketplaceNavbar from "@/components/marketplace/MarketplaceNavbar";
import CartDrawer from "@/components/marketplace/CartDrawer";

/**
 * MarketplaceLayout — wraps all marketplace routes (/shop, /product/*,
 * /cart, /checkout, /seller, /admin, /account) with:
 *   · The marketplace navbar (with cart icon)
 *   · The slide-out cart drawer
 *   · Top padding to clear the fixed navbar
 *
 * The marketing site at "/" uses its own layout (no navbar, no cart).
 */
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNavbar />
      <CartDrawer />
      <main className="flex-1 pt-20">{children}</main>
    </div>
  );
}
