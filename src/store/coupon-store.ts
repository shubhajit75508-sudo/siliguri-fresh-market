import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Coupon } from "@/types";

interface CouponState {
  coupons: Coupon[];
  addCoupon: (c: Coupon) => void;
  updateCoupon: (code: string, partial: Partial<Coupon>) => void;
  deleteCoupon: (code: string) => void;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      coupons: [],
      addCoupon: (c) =>
        set((state) => ({ coupons: [...state.coupons, c] })),
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
    { name: "sfm-coupons" }
  )
);
