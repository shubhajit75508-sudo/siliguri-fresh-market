"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Tag,
  Settings,
  Bell,
  Warehouse,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/store/admin-store";
import { useAuthStore } from "@/store/auth-store";

const adminLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/inventory", icon: Warehouse, label: "Inventory" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
  { href: "/admin/delivery", icon: Truck, label: "Delivery" },
  { href: "/admin/delivery-boys", icon: Users, label: "Delivery Boys" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/coupons", icon: Tag, label: "Coupons" },
  { href: "/admin/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoggedIn, logout } = useAdminStore();
  const { currentUser, logout: authLogout } = useAuthStore();
  const checked = useRef(false);

  // Wait for persisted stores to rehydrate before checking auth,
  // otherwise the layout redirects to login before state loads.
  const [storesReady, setStoresReady] = useState(false);

  useEffect(() => {
    useAdminStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
    const unsub1 = useAdminStore.persist.onFinishHydration(() => {
      if (useAdminStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) {
        setStoresReady(true);
      }
    });
    const unsub2 = useAuthStore.persist.onFinishHydration(() => {
      if (useAdminStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) {
        setStoresReady(true);
      }
    });
    // Fallback if already hydrated
    if (useAdminStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) {
      setStoresReady(true);
    }
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    if (!storesReady) return;
    if (checked.current) return;
    if (!isLoggedIn || currentUser?.role !== "admin") {
      router.push("/auth/login");
    }
    checked.current = true;
  }, [isLoggedIn, currentUser, pathname, router, storesReady]);

  if (!storesReady) return null;

  if (!isLoggedIn || currentUser?.role !== "admin") {
    if (pathname === "/admin/login") return <>{children}</>;
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Image src="/logo.png" alt="SFM" width={32} height={32} />
          <div>
            <p className="text-sm font-extrabold text-brand-dark">SFM Admin</p>
            <p className="text-[10px] text-muted">Dashboard</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-dark text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <button
            onClick={() => { logout(); authLogout(); document.cookie = "sfm-auth-session=; path=/; max-age=0"; router.push("/auth/login"); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-brand-dark">Admin Panel</h1>
          <Link
            href="/"
            className="ml-auto text-sm text-brand-blue hover:underline"
          >
            ← Back to Store
          </Link>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
