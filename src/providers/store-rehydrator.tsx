"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { useUserStore } from "@/store/user-store";

export function StoreRehydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useUserStore.persist.rehydrate();
  }, []);

  return null;
}
