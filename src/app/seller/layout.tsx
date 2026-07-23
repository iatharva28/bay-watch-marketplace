"use client";

import MarketplaceNavbar from "@/components/marketplace/MarketplaceNavbar";
import CartDrawer from "@/components/marketplace/CartDrawer";
import AuthGate from "@/components/marketplace/AuthGate";

/**
 * /seller requires seller role. Admins can also access.
 * A customer who tries to access /seller will see an
 * "insufficient access" message with a link to upgrade.
 */
export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNavbar />
      <CartDrawer />
      <main className="flex-1 pt-20">
        <AuthGate requiredRole="seller" reason="Sign in as a seller to access the seller portal.">
          {children}
        </AuthGate>
      </main>
    </div>
  );
}
