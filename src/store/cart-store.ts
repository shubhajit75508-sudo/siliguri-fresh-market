import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";
import { getPriceForWeight } from "@/lib/utils";
import { getDeliveryFeeForDistance, getMinOrderForDistance, getEtaForDistance } from "@/lib/delivery-zone";

export type CartLineKey = {
  productId: string;
  weight?: string;
  cut?: string;
  cleaning?: string;
};

export function cartLineKey(
  item: Pick<CartItem, "product" | "selectedWeight" | "selectedCut" | "selectedCleaning">
): CartLineKey {
  return {
    productId: item.product.id,
    weight: item.selectedWeight,
    cut: item.selectedCut,
    cleaning: item.selectedCleaning,
  };
}

export function cartLineId(key: CartLineKey): string {
  return [key.productId, key.weight ?? "", key.cut ?? "", key.cleaning ?? ""].join("|");
}

function matchesCartLine(item: CartItem, key: CartLineKey): boolean {
  return (
    item.product.id === key.productId &&
    item.selectedWeight === key.weight &&
    item.selectedCut === key.cut &&
    item.selectedCleaning === key.cleaning
  );
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  isOpen: boolean;
  distance: number | null;
  addItem: (
    product: Product,
    quantity?: number,
    options?: { weight?: string; cut?: string; cleaning?: string }
  ) => void;
  removeItem: (key: CartLineKey) => void;
  updateQuantity: (key: CartLineKey, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setDistance: (km: number | null) => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getMinOrder: () => number;
  getEta: () => string;
  getTotal: () => number;
  getItemCount: () => number;
  getProductQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        couponCode: null,
        couponDiscount: 0,
        isOpen: false,
        distance: null,

        addItem: (product, quantity = 1, options) => {
          if (!product.inStock) return;

          const key: CartLineKey = {
            productId: product.id,
            weight: options?.weight,
            cut: options?.cut,
            cleaning: options?.cleaning,
          };

          set((state) => {
            const existing = state.items.find((i) => matchesCartLine(i, key));
            if (existing) {
              return {
                items: state.items.map((i) =>
                  matchesCartLine(i, key)
                    ? { ...i, quantity: i.quantity + quantity }
                    : i
                ),
                isOpen: true,
              };
            }
            return {
              items: [
                ...state.items,
                {
                  product,
                  quantity,
                  selectedWeight: options?.weight,
                  selectedCut: options?.cut,
                  selectedCleaning: options?.cleaning,
                },
              ],
              isOpen: true,
            };
          });
        },

        removeItem: (key) =>
          set((state) => ({
            items: state.items.filter((i) => !matchesCartLine(i, key)),
          })),

        updateQuantity: (key, quantity) =>
          set((state) => ({
            items:
              quantity <= 0
                ? state.items.filter((i) => !matchesCartLine(i, key))
                : state.items.map((i) =>
                    matchesCartLine(i, key) ? { ...i, quantity } : i
                  ),
          })),

        clearCart: () => set({ items: [], couponCode: null, couponDiscount: 0 }),
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),

        applyCoupon: (code, discount) =>
          set({ couponCode: code, couponDiscount: discount }),

        removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

        setDistance: (km) => set({ distance: km }),

        getSubtotal: () =>
          get().items.reduce(
            (sum, i) =>
              sum + getPriceForWeight(i.product.price, i.selectedWeight || i.product.unit || "1kg", i.product.weightPrices) * i.quantity,
            0
          ),

        getDeliveryFee: () => {
          const subtotal = get().getSubtotal();
          const distance = get().distance;
          if (distance !== null) return getDeliveryFeeForDistance(distance, subtotal);
          if (subtotal < 99) return 59;
          if (subtotal < 299) return 40;
          return 0;
        },

        getMinOrder: () => {
          const distance = get().distance;
          if (distance !== null) return getMinOrderForDistance(distance);
          return 0;
        },

        getEta: () => {
          const distance = get().distance;
          if (distance !== null) return getEtaForDistance(distance);
          return "45-60 min";
        },

        getTotal: () => {
          const subtotal = get().getSubtotal();
          const discount = get().couponDiscount;
          const delivery = get().getDeliveryFee();
          return Math.max(0, subtotal - discount + delivery);
        },

        getItemCount: () =>
          get().items.reduce((sum, i) => sum + i.quantity, 0),

        getProductQuantity: (productId) =>
          get()
            .items.filter((i) => i.product.id === productId)
            .reduce((sum, i) => sum + i.quantity, 0),
      }),
      { name: "sfm-cart-v2" }
    ),
    { name: "CartStore" }
  )
);
