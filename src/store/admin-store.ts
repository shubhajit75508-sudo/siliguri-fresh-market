import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/types";

interface SectionConfig {
  category: string;
  title: string;
  subtitle: string;
  enabled: boolean;
}

interface HeroConfig {
  image: string;
  title: string;
  subtitle: string;
}

interface AppSettings {
  storeName: string;
  deliveryRadius: string;
  minOrderAmount: string;
  deliveryFee: string;
  operatingHours: string;
  hero: HeroConfig;
  sections: SectionConfig[];
}

interface AdminState {
  isLoggedIn: boolean;
  products: Product[];
  settings: AppSettings;
  login: () => boolean;
  loginDirect: (currentUser: { role?: string } | null) => void;
  logout: () => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  storeName: "",
  deliveryRadius: "",
  minOrderAmount: "",
  deliveryFee: "",
  operatingHours: "",
  hero: {
    image: "",
    title: "",
    subtitle: "",
  },
  sections: [],
};

export const useAdminStore = create<AdminState>()(
  devtools(
    persist(
      (set) => ({
        isLoggedIn: false,
        products: [],
        settings: defaultSettings,

        login: () => false,

        loginDirect: (currentUser) => {
          if (currentUser?.role === "admin") {
            set({ isLoggedIn: true });
          }
        },

        logout: () => set({ isLoggedIn: false }),

        addProduct: (product) =>
          set((state) => ({ products: [...state.products, product] })),

        updateProduct: (id, updates) =>
          set((state) => ({
            products: state.products.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          })),

        deleteProduct: (id) =>
          set((state) => ({
            products: state.products.filter((p) => p.id !== id),
          })),

        updateSettings: (updates) =>
          set((state) => ({
            settings: { ...state.settings, ...updates },
          })),
      }),
      {
        name: "sfm-admin-v2",
        storage: createJSONStorage(() => localStorage),
        merge: (persisted, current) => {
          const p = persisted as Record<string, unknown>;
          const pSettings = (p?.settings ?? {}) as Record<string, unknown>;
          const cSettings = current.settings;
          return {
            ...current,
            ...(persisted as object),
            settings: {
              ...cSettings,
              ...pSettings,
              hero: { ...cSettings.hero, ...((pSettings.hero ?? {}) as HeroConfig) },
              sections: Array.isArray(pSettings.sections)
                ? (pSettings.sections as SectionConfig[])
                : cSettings.sections,
            },
          };
        },
      }
    ),
    { name: "AdminStore" }
  )
);
