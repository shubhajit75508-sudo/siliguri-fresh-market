"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Truck, LogOut, Package, History } from "lucide-react";
import { useDeliveryStore } from "@/store/delivery-store";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const navLinks = [
  { href: "/delivery", icon: Package, label: "Deliveries" },
  { href: "/delivery/history", icon: History, label: "History" },
];

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { boy, logout } = useDeliveryStore();
  const { logout: authLogout } = useAuthStore();
  const checked = useRef(false);

  // Wait for persisted stores to rehydrate before checking auth
  const [storesReady, setStoresReady] = useState(false);

  useEffect(() => {
    useDeliveryStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
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
    if (useDeliveryStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) {
      setStoresReady(true);
    }
    return () => { unsub1(); unsub2(); };
  }, []);

  // Poll for new assignments every 15 seconds
  useEffect(() => {
    if (!storesReady || !boy) return;
    const interval = setInterval(() => {
      fetch("/api/admin/orders")
        .then((r) => r.json())
        .then((json) => {
          const allOrders: { id: string; delivery_boy_id?: string; customer_name: string; customer_phone: string; address_snapshot: Record<string, unknown>; items: { product: { name: string }; quantity: number }[]; total: number }[] = json.orders ?? [];
          const currentAssignments = useDeliveryStore.getState().assignments;
          const assignedIds = new Set(currentAssignments.map((a) => a.orderId));
          const newOrders = allOrders.filter(
            (o) => o.delivery_boy_id === boy.id && !assignedIds.has(o.id)
          );
          if (newOrders.length > 0) {
            const newAssignments = newOrders.map((o) => ({
              id: "da-" + Date.now() + Math.random().toString(36).slice(2, 6),
              orderId: o.id,
              customerName: o.customer_name,
              customerPhone: o.customer_phone,
              address: {
                id: o.id + "-addr",
                label: "Delivery",
                line1: (o.address_snapshot?.line1 as string) ?? "",
                line2: (o.address_snapshot?.line2 as string) ?? "",
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
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [storesReady, boy]);

  useEffect(() => {
    if (!storesReady) return;
    if (checked.current) return;
    if (!boy && pathname !== "/delivery/login") {
      router.push("/auth/login");
    }
    checked.current = true;
  }, [boy, pathname, router, storesReady]);

  if (!storesReady) return null;

  if (!boy) {
    if (pathname === "/delivery/login") return <>{children}</>;
    return null;
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
