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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-border shadow-[0_-1px_3px_rgba(0,0,0,0.04)] safe-bottom lg:hidden">
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
                active ? "text-[#2D7D3A]" : "text-muted"
              )}
            >
              <Icon className={cn("h-[22px] w-[22px]", active && "text-[#2D7D3A]")} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}

        <button onClick={openCart} className="relative -mt-4 flex flex-col items-center">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#2D7D3A] text-white shadow-lg shadow-[#2D7D3A]/25">
            <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
            {count > 0 && (
              <span className="absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 flex h-5 w-5 items-center justify-center rounded-full bg-[#F5A623] text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </div>
          <span className="mt-1 text-[10px] font-semibold text-foreground">Cart</span>
        </button>
      </div>
    </nav>
  );
}
