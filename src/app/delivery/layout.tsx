"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Truck, LogOut, Package, History } from "lucide-react";
import { useDeliveryStore } from "@/store/delivery-store";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/delivery", icon: Package, label: "Deliveries" },
  { href: "/delivery/history", icon: History, label: "History" },
];

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { boy, logout } = useDeliveryStore();
  const { logout: authLogout, currentUser } = useAuthStore();

  // Wait for persisted stores to rehydrate before checking auth
  const [storesReady, setStoresReady] = useState(false);

  useEffect(() => {
    if (useDeliveryStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) {
      setStoresReady(true);
      return;
    }
    const unsub1 = useDeliveryStore.persist.onFinishHydration(() => {
      if (useDeliveryStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) {
        setStoresReady(true);
      }
    });
    const unsub2 = useAuthStore.persist.onFinishHydration(() => {
      if (useDeliveryStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) {
        setStoresReady(true);
      }
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  // Auto-set boy from auth user after login
  useEffect(() => {
    if (!storesReady) return;
    if (boy) return;
    if (currentUser?.role === "delivery") {
      console.debug("[delivery] auto-setting boy from currentUser", currentUser.id);
      useDeliveryStore.getState().loginAsBoy({ id: currentUser.id, name: currentUser.name, phone: currentUser.phone }, currentUser.name, currentUser.phone);
    }
  }, [storesReady, boy, currentUser]);

  // Poll for new assignments every 15 seconds
  useEffect(() => {
    if (!storesReady || !boy) return;

    // Remove stale assignments from other delivery boys
    const allCurrent = useDeliveryStore.getState().assignments;
    const mine = allCurrent.filter((a) => a.deliveryBoyId === boy.id);
    if (mine.length !== allCurrent.length) {
      useDeliveryStore.getState().setAssignments(mine);
    }

    const interval = setInterval(() => {
      fetch("/api/admin/orders")
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then((json) => {
          const allOrders: { id: string; delivery_boy_id?: string; customer_name: string; customer_phone: string; address_snapshot: Record<string, unknown>; items: { product: { name: string }; quantity: number }[]; total: number }[] = json.orders ?? [];
          const currentAssignments = useDeliveryStore.getState().assignments;
          const assignedIds = new Set(currentAssignments.map((a) => a.orderId));
          const newOrders = allOrders.filter(
            (o) => o.delivery_boy_id === boy.id && !assignedIds.has(o.id)
          );
          if (newOrders.length > 0) {
            const newAssignments = newOrders.map((o) => ({
              id: "da-" + crypto.randomUUID(),
              orderId: o.id,
              deliveryBoyId: boy.id,
              customerName: o.customer_name,
              customerPhone: o.customer_phone,
              address: {
                id: o.id + "-addr",
                label: "Delivery",
                line1: (o.address_snapshot?.line1 as string) ?? "",
                line2: (o.address_snapshot?.line2 as string) ?? "",
                area: (o.address_snapshot?.area as string) ?? undefined,
                landmark: (o.address_snapshot?.landmark as string) ?? undefined,
                building: (o.address_snapshot?.building as string) ?? undefined,
                flat: (o.address_snapshot?.flat as string) ?? undefined,
                floor: (o.address_snapshot?.floor as string) ?? undefined,
                city: (o.address_snapshot?.city as string) ?? "",
                pincode: (o.address_snapshot?.pincode as string) ?? "",
                lat: o.address_snapshot?.lat as number | undefined,
                lng: o.address_snapshot?.lng as number | undefined,
                isDefault: false,
              },
              items: o.items?.map((i: { product: { name: string }; quantity: number }) => ({ name: i.product.name, quantity: i.quantity })) ?? [],
              total: o.total,
              status: "assigned" as const,
              assignedAt: new Date().toISOString(),
            }));
            useDeliveryStore.getState().setAssignments([...currentAssignments, ...newAssignments]);
          }
        })
        .catch((e) => { console.warn("[delivery] poll error:", e); });
    }, 15000);
    return () => clearInterval(interval);
  }, [storesReady, boy]);

  useEffect(() => {
    if (!storesReady) return;
    if (!boy && pathname !== "/delivery/login") {
      const user = useAuthStore.getState().currentUser;
      if (user?.role !== "delivery") {
        router.push("/auth/login");
      }
    }
  }, [boy, pathname, router, storesReady]);

  if (!storesReady) return null;

  if (!boy) {
    if (pathname === "/delivery/login") return <>{children}</>;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-fresh border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Loading your deliveries...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-14 items-center gap-3 border-b bg-white px-4 shadow-sm">
        <Truck className="h-5 w-5 text-brand-fresh-dim" />
        <div className="leading-none">
          <p className="text-sm font-bold">{boy.name}</p>
          <p className="text-[11px] text-muted">{boy.area}</p>
        </div>
        <nav className="ml-auto flex items-center gap-1">
          {navLinks.map((l) => {
            const Icon = l.icon;
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-brand-fresh/10 text-brand-fresh-dim" : "text-muted hover:bg-surface"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={() => { logout(); authLogout(); document.cookie = "sfm-auth-session=; path=/; max-age=0"; router.push("/auth/login"); }}
            className="ml-2 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-red hover:bg-brand-red/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </nav>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
