import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Coupon } from "@/types";

interface CouponState {
  coupons: Coupon[];
  addCoupon: (c: Coupon) => void;
  updateCoupon: (code: string, partial: Partial<Coupon>) => void;
  deleteCoupon: (code: string) => void;
}

export const useCouponStore = create<CouponState>()(
  devtools(
    persist(
      (set, get) => ({
        coupons: [],
        addCoupon: (c) => {
          if (get().coupons.some((existing) => existing.code === c.code)) return;
          set((state) => ({ coupons: [...state.coupons, c] }));
        },
        updateCoupon: (code, partial) =>
          set((state) => ({
            coupons: state.coupons.map((c) =>
              c.code === code ? { ...c, ...partial } : c
            ),
          })),
        deleteCoupon: (code) =>
          set((state) => ({
            coupons: state.coupons.filter((c) => c.code !== code),
          })),
      }),
      { name: "sfm-coupons", version: 1 }
    ),
    { name: "CouponStore" }
  )
);
