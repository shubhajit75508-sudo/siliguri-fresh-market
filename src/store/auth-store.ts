import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ADMIN_CREDS } from "@/lib/admin-creds";

export type UserRole = "admin" | "delivery" | "customer";

export interface AuthUser {
  id: string;
  email: string;
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

const passwordHash: Record<string, string> = {};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        users: [],
        currentUser: null,

        signup: async (data) => {
          const { users } = get();

          if (data.role === "admin") {
            return { success: false, error: "Admin accounts cannot be created via signup." };
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
            if (authData?.user) supabaseUserId = authData.user.id;
          }

          const userId = supabaseUserId ?? "auth-" + crypto.randomUUID();

          try {
            await fetch("/api/admin/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: userId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                loyalty_points: 0,
              }),
            });
          } catch (e) { console.error("User upsert failed:", e); }

          const hashedPassword = await hashPassword(data.password);
          const { password: _, ...dataWithoutPassword } = data;
          const newUser: AuthUser = {
            id: supabaseUserId ?? "auth-" + crypto.randomUUID(),
            ...dataWithoutPassword,
            createdAt: new Date().toISOString(),
          };
          passwordHash[newUser.id] = hashedPassword;
          set({ users: [...users, newUser] });
          return { success: true };
        },

        resetPassword: async (email: string, newPassword: string) => {
          const { users } = get();
          const user = users.find((u) => u.email === email);
          if (!user) return { success: false, error: "Email not found" };
          const hashed = await hashPassword(newPassword);
          passwordHash[user.id] = hashed;
          return { success: true };
        },

        login: async (email, password) => {
          const adminCred = ADMIN_CREDS.find((c) => c.email === email);
          if (adminCred) {
            if (adminCred.password !== password) {
              return { success: false, error: "Incorrect password" };
            }
            const { users } = get();
            let user = users.find((u) => u.email === email);
            if (!user) {
              const id = "admin-" + crypto.randomUUID();
              user = {
                id,
                email,
                name: email.split("@")[0],
                phone: "",
                address: "",
                role: "admin",
                location: null,
                createdAt: new Date().toISOString(),
              };
              set({ users: [...users, user] });
            }
            const adminUser = { ...user, role: "admin" as const };
            set({ currentUser: adminUser });
            document.cookie = `sfm-auth-session=${adminUser.id}|admin; path=/; max-age=${60 * 60 * 24 * 7}`;
            return { success: true, user: adminUser };
          }

          if (isSupabaseConfigured() && supabase) {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (!error) {
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
              } catch {
                // row not found — will migrate below
              }

              if (dbRole === null) {
                try {
                  await fetch("/api/admin/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: user.id,
                      name: user.user_metadata?.name ?? localUser?.name ?? email.split("@")[0],
                      email,
                      phone: localUser?.phone ?? user.user_metadata?.phone ?? "",
                      role: localUser?.role ?? user.user_metadata?.role ?? "customer",
                      loyalty_points: 0,
                    }),
                  });
                } catch (e) {
                  console.warn("Failed to migrate user to users table:", e);
                }
              }

              const resolvedRole = (localUser?.role ?? dbRole ?? user.user_metadata?.role ?? "customer") as UserRole;
              const newUser: AuthUser = {
                id: user.id,
                email: user.email ?? email,
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
          }

          const { users } = get();
          const user = users.find((u) => u.email === email);
          if (!user) {
            return { success: false, error: "No account found with this email" };
          }
          const storedHash = passwordHash[user.id];
          if (!storedHash) {
            return { success: false, error: "No password set for this account" };
          }
          const hashed = await hashPassword(password);
          if (storedHash !== hashed) {
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
          const { users } = get();
          return users.some((u) => u.role === "admin") || ADMIN_CREDS.some((c) => users.some((u) => u.email === c.email));
        },
      }),
      { name: "sfm-auth" }
    ),
    { name: "AuthStore" }
  )
);
