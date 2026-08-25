"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { DeliveryStrip } from "@/components/layout/delivery-strip";
import { StoreHoursBanner } from "@/components/layout/store-hours-banner";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname === "/checkout";
  const isLanding = pathname === "/landingpage";

  return (
    <div className="min-h-screen">
      {!isLanding && <Header />}
      {!isLanding && <StoreHoursBanner />}
      {!isLanding && <DeliveryStrip />}
      <main className={`mx-auto w-full flex-1 px-4 pb-28 sm:px-6 lg:pb-12 ${isLanding ? "" : "max-w-7xl"}`}>
        {children}
      </main>
      {!hideFooter && !isLanding && <Footer />}
      {!hideFooter && !isLanding && <WhatsAppFab />}
      {!isLanding && <PWAInstallPrompt />}
      {!isLanding && <BottomNav />}
    </div>
  );
}
