"use client";

import MarketplaceNavbar from "@/components/marketplace/MarketplaceNavbar";
import CartDrawer from "@/components/marketplace/CartDrawer";
import AuthGate from "@/components/marketplace/AuthGate";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNavbar />
      <CartDrawer />
      <main className="flex-1 pt-20">
        <AuthGate requiredRole="customer" reason="Sign in to view product details and add pieces to your cart.">
          {children}
        </AuthGate>
      </main>
    </div>
  );
}
