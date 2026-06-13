import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export type UserRole = "admin" | "delivery" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  role: UserRole;
  location: { lat: number; lng: number } | null;
  createdAt: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  role: UserRole;
  location: { lat: number; lng: number } | null;
}

interface AuthState {
  users: AuthUser[];
  currentUser: AuthUser | null;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  deleteAccountSync: (id: string) => void;
  adminExists: () => boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,

      signup: async (data) => {
        const { users } = get();

        if (data.role === "admin") {
          let adminExists = users.some((u) => u.role === "admin");
          if (!adminExists && isSupabaseConfigured() && supabase) {
            try {
              const { count } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "admin");
              if (count && count > 0) adminExists = true;
            } catch (e) { console.error("Admin check query failed:", e); }
          }
          if (adminExists) {
            return { success: false, error: "Only one admin account is allowed. An admin already exists." };
          }
        }

        if (users.find((u) => u.email === data.email)) {
          return { success: false, error: "Email already registered" };
        }

        let supabaseUserId: string | undefined;

        if (isSupabaseConfigured() && supabase) {
          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                name: data.name,
                phone: data.phone,
                address: data.address,
                role: data.role,
              },
            },
          });
          if (error) return { success: false, error: error.message };

          if (authData?.user) {
            supabaseUserId = authData.user.id;
            try {
              await supabase.from("users").upsert({
                id: authData.user.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                loyalty_points: 0,
              });
            } catch (e) { console.error("User upsert failed:", e); }
          }
        }

        const hashedPassword = await hashPassword(data.password);
        const newUser: AuthUser = {
          id: supabaseUserId ?? "auth-" + crypto.randomUUID(),
          ...data,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
        };
        set({ users: [...users, newUser] });
        return { success: true };
      },

      resetPassword: async (email: string, newPassword: string) => {
        const { users } = get();
        const idx = users.findIndex((u) => u.email === email);
        if (idx === -1) return { success: false, error: "Email not found" };
        const hashed = await hashPassword(newPassword);
        const updated = [...users];
        updated[idx] = { ...updated[idx], password: hashed };
        set({ users: updated });
        return { success: true };
      },

      login: async (email, password) => {
        if (isSupabaseConfigured() && supabase) {
          const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) return { success: false, error: error.message };
          const user = authData.user;
          const localUser = get().users.find((u) => u.email === email);
          let dbRole: string | null = null;
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("role")
              .eq("id", user.id)
              .single();
            if (profile) dbRole = profile.role as string;
          } catch (e) {
            console.warn("Failed to fetch user role from Supabase:", e);
          }
          const resolvedRole = (localUser?.role ?? dbRole ?? user.user_metadata?.role ?? "customer") as UserRole;
          const newUser: AuthUser = {
            id: user.id,
            email: user.email ?? email,
            password: "",
            name: user.user_metadata?.name ?? localUser?.name ?? email.split("@")[0],
            phone: user.user_metadata?.phone ?? localUser?.phone ?? "",
            address: user.user_metadata?.address ?? localUser?.address ?? "",
            role: resolvedRole,
            location: localUser?.location ?? null,
            createdAt: user.created_at ?? localUser?.createdAt ?? new Date().toISOString(),
          };
          set((state) => {
            const exists = state.users.some((u) => u.id === newUser.id);
            return {
              currentUser: newUser,
              users: exists ? state.users : [...state.users, newUser],
            };
          });
          document.cookie = `sfm-auth-session=${newUser.id}|${newUser.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
          return { success: true, user: newUser };
        }

        const { users } = get();
        const user = users.find((u) => u.email === email);
        if (!user) {
          return { success: false, error: "No account found with this email" };
        }
        const hashed = await hashPassword(password);
        if (user.password !== hashed) {
          return { success: false, error: "Incorrect password" };
        }
          set({ currentUser: user });
          document.cookie = `sfm-auth-session=${user.id}|${user.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
          return { success: true, user };
        },

        logout: async () => {
          if (isSupabaseConfigured() && supabase) {
            await supabase.auth.signOut();
          }
          document.cookie = "sfm-auth-session=; path=/; max-age=0";
          set({ currentUser: null });
        },

      deleteAccountSync: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
        })),

      adminExists: () => {
        const localAdmin = get().users.some((u) => u.role === "admin");
        return localAdmin;
      },
    }),
    { name: "sfm-auth" }
  )
);
