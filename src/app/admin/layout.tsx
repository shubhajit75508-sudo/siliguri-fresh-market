"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  IndianRupee,
  Menu,
  X,
  LogOut,
  Route,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/store/admin-store";
import { useAuthStore } from "@/store/auth-store";
import { MANAGER_ACCESS } from "@/lib/manager-access";
import "./admin-theme.css";

/**
 * Nav is grouped so the console reads as a few clear jobs rather than a flat
 * list of 13 items. `accent` marks the handful that are the daily drivers.
 */
const adminLinks = [
  { section: "Overview", items: [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/analytics", icon: BarChart3, label: "Analytics", accent: true },
  ]},
  { section: "Sales", items: [
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders", accent: true },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/inventory", icon: Warehouse, label: "Inventory" },
    { href: "/admin/coupons", icon: Tag, label: "Coupons" },
  ]},
  { section: "People", items: [
    { href: "/admin/customers", icon: Users, label: "Customers" },
  ]},
  { section: "Delivery", items: [
    { href: "/admin/delivery", icon: Truck, label: "Delivery Board", accent: true },
    { href: "/admin/routes", icon: Route, label: "Route Planner" },
    { href: "/admin/delivery-boys", icon: Users, label: "Delivery Boys" },
  ]},
  { section: "Finance", items: [
    { href: "/admin/earnings", icon: IndianRupee, label: "Earnings" },
  ]},
  { section: "System", items: [
    { href: "/admin/notifications", icon: Bell, label: "Notifications" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ]},
];

/** Phone tab bar: the four screens that get opened during a delivery day. */
const QUICK_PATHS = [
  { href: "/admin", icon: LayoutDashboard, label: "Home" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/delivery", icon: Truck, label: "Delivery" },
  { href: "/admin/analytics", icon: BarChart3, label: "Stats" },
];

const isLinkActive = (href: string, pathname: string) =>
  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

/**
 * zustand's persist middleware never attaches `api.persist` when storage is
 * unavailable, so on the server `useAdminStore.persist` is undefined. Probe
 * defensively — this also runs during SSR.
 */
function storesHydrated(): boolean {
  if (typeof window === "undefined") return false;
  return useAdminStore.persist?.hasHydrated() === true && useAuthStore.persist?.hasHydrated() === true;
}

// Manager portal is limited to day-to-day ops: orders, delivery board, route
// planning, and now products + inventory management. It deliberately excludes
// analytics/earnings (profit/cost) and the rest of the shop admin console.
// The single source of truth for this list lives in `src/lib/manager-access.ts`.

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

  const role = currentUser?.role;
  const isStaff = role === "admin" || role === "manager";
  const allLinks = adminLinks.flatMap((g) => g.items);
  const visible = (href: string) => (role === "manager" ? MANAGER_ACCESS.has(href) : true);
  const groups = adminLinks
    .map((g) => ({ ...g, items: g.items.filter((l) => visible(l.href)) }))
    .filter((g) => g.items.length > 0);

  // Manager is denied access to the dashboard and any page outside their scope.
  const managerBanned =
    role === "manager" && (pathname === "/admin" || !MANAGER_ACCESS.has(pathname));

  const current = allLinks.find((l) => isLinkActive(l.href, pathname));

  // Wait for persisted stores to rehydrate before checking auth,
  // otherwise the layout redirects to login before state loads.
  // Read lazily so an already-hydrated store never triggers a second render pass.
  const [storesReady, setStoresReady] = useState(storesHydrated);

  useEffect(() => {
    useAdminStore.persist?.rehydrate();
    useAuthStore.persist?.rehydrate();
    const markReady = () => {
      if (storesHydrated()) setStoresReady(true);
    };
    const unsub1 = useAdminStore.persist?.onFinishHydration(markReady);
    const unsub2 = useAuthStore.persist?.onFinishHydration(markReady);
    return () => { unsub1?.(); unsub2?.(); };
  }, []);

  useEffect(() => {
    if (!storesReady) return;
    if (checked.current) return;
    if (!isLoggedIn || !isStaff) {
      router.push("/auth/login");
    } else if (managerBanned) {
      router.push("/admin/orders");
    }
    checked.current = true;
  }, [isLoggedIn, currentUser, pathname, router, storesReady, isStaff, managerBanned]);

  // Lock body scroll while the drawer covers the screen.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (!storesReady) {
    return (
      <div className="admin-theme adm-root flex min-h-screen items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className="adm-live" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Establishing link</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isStaff) {
    if (pathname === "/admin/login") {
      return <div className="admin-theme adm-root min-h-screen">{children}</div>;
    }
    return (
      <div className="admin-theme adm-root flex min-h-screen items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className="adm-live" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Redirecting</p>
        </div>
      </div>
    );
  }

  if (managerBanned) {
    return (
      <div className="admin-theme adm-root flex min-h-screen items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className="adm-live" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Redirecting</p>
        </div>
      </div>
    );
  }

  const signOut = () => {
    logout();
    authLogout();
    document.cookie = "sfm-auth-session=; path=/; max-age=0";
    router.push("/auth/login");
  };

  return (
    <div className="admin-theme adm-root flex min-h-screen text-foreground">
      {/* ── Drawer / sidebar ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r adm-hairline transition-transform duration-300 ease-out lg:translate-x-0 lg:static",
          "bg-[#0a0b0e]/95 backdrop-blur-xl",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b adm-hairline px-4">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ff7a1a] to-[#ff9a3c] text-black shadow-[0_0_20px_-4px_rgba(255,122,26,0.7)]">
            <Zap className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold tracking-tight">SFM Control</p>
            <p className="adm-eyebrow truncate">{role === "manager" ? "Manager" : "Admin"}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="adm-tile ml-auto h-9 w-9 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.section}>
              <p className="adm-nav-section">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((link) => {
                  const Icon = link.icon;
                  const active = isLinkActive(link.href, pathname);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      data-active={active}
                      className="adm-nav-link"
                    >
                      <Icon className="adm-nav-icon h-4 w-4" />
                      <span className="truncate">{link.label}</span>
                      {link.accent && !active ? (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff7a1a]/70" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="shrink-0 border-t adm-hairline p-3">
          <button onClick={signOut} className="adm-nav-link w-full text-[#f87171] hover:bg-[#ef4444]/10">
            <LogOut className="adm-nav-icon h-4 w-4 text-[#f87171]" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Scrim */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Main column ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b adm-hairline bg-[#0a0b0e]/85 px-3 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="adm-tile h-10 w-10 shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="adm-eyebrow hidden sm:inline">Console</span>
              <ChevronRight className="hidden h-3 w-3 shrink-0 text-[#7d8794] sm:block" />
              <h1 className="truncate text-sm font-bold sm:text-base">{current?.label ?? "Admin"}</h1>
            </div>
            <p className="truncate text-[11px] text-muted sm:hidden">{role === "manager" ? "Manager" : "Administrator"}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border adm-hairline bg-white/[0.03] px-3 py-1.5 md:inline-flex">
              <span className="adm-live" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b0]">Live</span>
            </span>
            <Link
              href="/"
              className="flex h-10 items-center gap-1.5 rounded-xl border adm-hairline bg-white/[0.03] px-3 text-[11px] font-semibold text-[#98a2b0] transition-colors hover:border-[#ff7a1a]/50 hover:text-[#ff7a1a] sm:px-3.5 sm:text-xs"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              <span className="hidden sm:inline">Store</span>
            </Link>
          </div>
        </header>

        <main className="adm-main flex-1 px-3 py-4 sm:px-5 sm:py-6">{children}</main>
      </div>

      {/* ── Phone tab bar ─────────────────────────────────────────────────── */}
      <nav className="adm-tabbar lg:hidden" aria-label="Quick navigation">
        {QUICK_PATHS.filter((q) => visible(q.href)).map((q) => {
          const Icon = q.icon;
          const active = isLinkActive(q.href, pathname);
          return (
            <Link
              key={q.href}
              href={q.href}
              data-active={active}
              className="adm-tabbar-link"
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
              <span>{q.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
