"use client";

import dynamic from "next/dynamic";
import { QueryProvider } from "./query-provider";
import { StoreRehydrator } from "./store-rehydrator";

/**
 * CartDrawer and Toaster both pull in framer-motion. Importing them lazily
 * keeps that weight out of the root critical chunk so it isn't parsed before
 * first paint on every route — including admin and auth pages that never open
 * a cart drawer. They still mount right after hydration, so no behavioural
 * change; ssr:false because neither exists during server render.
 */
const CartDrawer = dynamic(
  () => import("@/components/cart/cart-drawer").then((m) => m.CartDrawer),
  { ssr: false }
);

const Toaster = dynamic(
  () => import("@/components/ui/toaster").then((m) => m.Toaster),
  { ssr: false }
);

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
