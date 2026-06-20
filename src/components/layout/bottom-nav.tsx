"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Heart, User, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: LayoutGrid, label: "Browse" },
  { href: "/account/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/account", icon: User, label: "Account" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { getItemCount, openCart } = useCartStore();
  const hydrated = useHydrated();
  const count = hydrated ? getItemCount() : 0;

  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0d1b2a]/95 backdrop-blur-xl safe-bottom lg:hidden">
      <div className="flex items-end justify-around px-1 pb-2 pt-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : item.href === "/account" ? (pathname === "/account" || (pathname.startsWith("/account/") && !pathname.startsWith("/account/wishlist"))) : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                active ? "text-white" : "text-[#80949b]"
              )}
            >
              <Icon className={cn("h-[22px] w-[22px]", active && "text-[#2ecc71]")} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}

        <button onClick={openCart} className="relative -mt-4 flex flex-col items-center">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#2ecc71] text-[#0a1f1c] shadow-lg shadow-[#2ecc71]/30">
            <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0d1b2a] bg-white text-[10px] font-bold text-[#0a1f1c]">
                {count}
              </span>
            )}
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white">Cart</span>
        </button>
      </div>
    </nav>
  );
}
