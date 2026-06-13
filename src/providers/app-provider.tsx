"use client";

import { QueryProvider } from "./query-provider";
import { StoreRehydrator } from "./store-rehydrator";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Toaster } from "@/components/ui/toaster";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <StoreRehydrator />
      {children}
      <CartDrawer />
      <Toaster />
    </QueryProvider>
  );
}
