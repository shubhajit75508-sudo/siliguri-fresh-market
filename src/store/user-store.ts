import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address, User } from "@/types";

export interface CoinActivity {
  action: string;
  coins: number;
  date: string;
}

interface UserState {
  user: User | null;
  addresses: Address[];
  recentlyViewed: string[];
  searchHistory: string[];
  wishlist: string[];
  coinsRedeemed: number;
  activityLog: CoinActivity[];
  deliveryPincode: string;
  setUser: (user: User | null) => void;
  updateUser: (partial: Partial<User>) => void;
  addAddress: (address: Address) => void;
  addToRecentlyViewed: (productId: string) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  earnCoins: (orderAmount: number) => void;
  redeemCoins: (coins: number) => number;
  applyCoinsRedemption: (coins: number) => void;
  removeCoinsRedemption: () => void;
  setDeliveryPincode: (pincode: string) => void;
}

// Track coin operations that need backend confirmation.
// In mock mode they execute immediately; with backend they queue.
const pendingCoinOps: { type: "earn" | "redeem"; coins: number }[] = [];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      addresses: [],
      recentlyViewed: [],
      searchHistory: [],
      wishlist: [],
      coinsRedeemed: 0,
      deliveryPincode: "",
      activityLog: [],

      setUser: (user) => set({ user }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        })),
      addAddress: (address) =>
        set((state) => ({ addresses: [...state.addresses, address] })),

      addToRecentlyViewed: (productId) =>
        set((state) => ({
          recentlyViewed: [
            productId,
            ...state.recentlyViewed.filter((id) => id !== productId),
          ].slice(0, 10),
        })),

      addToSearchHistory: (query) =>
        set((state) => ({
          searchHistory: [
            query,
            ...state.searchHistory.filter((q) => q !== query),
          ].slice(0, 8),
        })),

      clearSearchHistory: () => set({ searchHistory: [] }),

      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        })),

      isInWishlist: (productId) => get().wishlist.includes(productId),

      earnCoins: (orderAmount) => {
        const earned = Math.floor(orderAmount / 100) * 10;
        if (earned <= 0) return;
        const user = get().user;
        if (!user) return;
        pendingCoinOps.push({ type: "earn", coins: earned });
        set((state) => ({
          user: { ...user, loyaltyPoints: user.loyaltyPoints + earned },
          activityLog: [
            { action: `Order earned coins`, coins: earned, date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }) },
            ...state.activityLog,
          ].slice(0, 20),
        }));
      },

      redeemCoins: (coins) => {
        const user = get().user;
        if (!user || user.loyaltyPoints < coins || coins < 100) return 0;
        const discount = Math.floor(coins / 100) * 50;
        pendingCoinOps.push({ type: "redeem", coins });
        set((state) => ({
          user: { ...user, loyaltyPoints: user.loyaltyPoints - coins },
          activityLog: [
            { action: `Redeemed ${coins} coins`, coins: -coins, date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }) },
            ...state.activityLog,
          ].slice(0, 20),
        }));
        return discount;
      },

      applyCoinsRedemption: (coins) => {
        const user = get().user;
        if (!user || user.loyaltyPoints < coins) return;
        set({ coinsRedeemed: coins });
      },

      removeCoinsRedemption: () => set({ coinsRedeemed: 0 }),

      setDeliveryPincode: (pincode) => set({ deliveryPincode: pincode }),
    }),
    { name: "sfm-user", skipHydration: true }
  )
);
