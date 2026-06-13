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

        if (data.role === "admin" && users.some((u) => u.role === "admin")) {
          return { success: false, error: "Only one admin account is allowed. An admin already exists." };
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
            } catch {}
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
          // Fall back to local user record for role/metadata when Supabase
          // user_metadata is empty (e.g. accounts created before metadata was added).
          const localUser = get().users.find((u) => u.email === email);
          // As a last resort, check the Supabase "users" table for the role.
          let dbRole: string | null = null;
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("role")
              .eq("id", user.id)
              .single();
            if (profile) dbRole = profile.role as string;
          } catch {}
          const newUser: AuthUser = {
            id: user.id,
            email: user.email ?? email,
            password: "",
            name: user.user_metadata?.name ?? localUser?.name ?? email.split("@")[0],
            phone: user.user_metadata?.phone ?? localUser?.phone ?? "",
            address: user.user_metadata?.address ?? localUser?.address ?? "",
            role: (localUser?.role ?? dbRole ?? user.user_metadata?.role ?? "customer") as UserRole,
            location: localUser?.location ?? null,
            createdAt: user.created_at ?? localUser?.createdAt ?? new Date().toISOString(),
          };
          set({ currentUser: newUser });
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
        return { success: true, user };
      },

      logout: async () => {
        if (isSupabaseConfigured() && supabase) {
          await supabase.auth.signOut();
        }
        set({ currentUser: null });
      },

      deleteAccountSync: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
        })),

      adminExists: () => get().users.some((u) => u.role === "admin"),
    }),
    { name: "sfm-auth" }
  )
);
