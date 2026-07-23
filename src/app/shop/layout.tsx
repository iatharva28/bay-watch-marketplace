"use client";

import MarketplaceNavbar from "@/components/marketplace/MarketplaceNavbar";
import CartDrawer from "@/components/marketplace/CartDrawer";
import AuthGate from "@/components/marketplace/AuthGate";

/**
 * /shop requires customer login. Sellers and admins can also
 * browse (admin > seller > customer in role hierarchy).
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNavbar />
      <CartDrawer />
      <main className="flex-1 pt-20">
        <AuthGate requiredRole="customer" reason="Sign in to browse the BAY marketplace and add pieces to your cart.">
          {children}
        </AuthGate>
      </main>
    </div>
  );
}
