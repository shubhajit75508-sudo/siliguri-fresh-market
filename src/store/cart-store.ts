import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";
import { getWeightMultiplier } from "@/lib/utils";

export type CartLineKey = {
  productId: string;
  weight?: string;
};

export function cartLineKey(
  item: Pick<CartItem, "product" | "selectedWeight">
): CartLineKey {
  return {
    productId: item.product.id,
    weight: item.selectedWeight,
  };
}

export function cartLineId(key: CartLineKey): string {
  return [key.productId, key.weight ?? ""].join("|");
}

function matchesCartLine(item: CartItem, key: CartLineKey): boolean {
  return (
    item.product.id === key.productId &&
    item.selectedWeight === key.weight
  );
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  isOpen: boolean;
  addItem: (
    product: Product,
    quantity?: number,
    options?: { weight?: string }
  ) => void;
  removeItem: (key: CartLineKey) => void;
  updateQuantity: (key: CartLineKey, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
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

        addItem: (product, quantity = 1, options) => {
          if (!product.inStock) return;

          const key: CartLineKey = {
            productId: product.id,
            weight: options?.weight,
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

        getSubtotal: () =>
          get().items.reduce(
            (sum, i) =>
              sum + i.product.price * getWeightMultiplier(i.selectedWeight) * i.quantity,
            0
          ),

        getDeliveryFee: () => {
          const subtotal = get().getSubtotal();
          if (subtotal >= 299) return 0;
          return 40;
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
