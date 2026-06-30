"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { DeliveryStrip } from "@/components/layout/delivery-strip";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname === "/checkout";

  return (
    <div className="page-bg min-h-screen">
      <Header />
      <DeliveryStrip />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 sm:px-6 lg:pb-12">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <BottomNav />
    </div>
  );
}
