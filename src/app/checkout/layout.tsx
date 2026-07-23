"use client";

import MarketplaceNavbar from "@/components/marketplace/MarketplaceNavbar";
import CartDrawer from "@/components/marketplace/CartDrawer";
import AuthGate from "@/components/marketplace/AuthGate";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNavbar />
      <CartDrawer />
      <main className="flex-1 pt-20">
        <AuthGate requiredRole="customer" reason="Sign in to complete your purchase securely.">
          {children}
        </AuthGate>
      </main>
    </div>
  );
}
