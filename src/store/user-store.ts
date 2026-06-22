import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Address, User } from "@/types";

interface UserState {
  user: User | null;
  addresses: Address[];
  recentlyViewed: string[];
  searchHistory: string[];
  wishlist: string[];
  deliveryPincode: string;
  setUser: (user: User | null) => void;
  updateUser: (partial: Partial<User>) => void;
  addAddress: (address: Address) => void;
  updateAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addToRecentlyViewed: (productId: string) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  setDeliveryPincode: (pincode: string) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        addresses: [],
        recentlyViewed: [],
        searchHistory: [],
        wishlist: [],
        deliveryPincode: "",

    setUser: (user) => set({ user }),
    updateUser: (partial) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...partial } : state.user,
      })),
    addAddress: (address) =>
      set((state) => ({ addresses: [...state.addresses, address] })),
    updateAddress: (address) =>
      set((state) => ({
        addresses: state.addresses.map((a) => (a.id === address.id ? address : a)),
      })),
    deleteAddress: (id) =>
      set((state) => ({
        addresses: state.addresses.filter((a) => a.id !== id),
      })),
    setDefaultAddress: (id) =>
      set((state) => ({
        addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
      })),

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

        setDeliveryPincode: (pincode) => set({ deliveryPincode: pincode }),
      }),
      { name: "sfm-user-v2" }
    ),
    { name: "UserStore" }
  )
);
