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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E3EDE4] bg-white/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(16,45,20,0.06)] safe-bottom lg:hidden">
      <div className="flex items-end justify-around px-1 pb-2 pt-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : item.href === "/account" ? (pathname === "/account" || (pathname.startsWith("/account/") && !pathname.startsWith("/account/wishlist"))) : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors"
            >
              <span
                className={cn(
                  "absolute -top-[1px] h-[3px] w-9 rounded-b-full transition-all",
                  active ? "bg-[#2D7D3A]" : "bg-transparent"
                )}
              />
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  active ? "bg-[#2D7D3A]/10" : "bg-transparent"
                )}
              >
                <Icon
                  className={cn("h-[21px] w-[21px] transition-all", active ? "text-[#2D7D3A]" : "text-muted group-active:scale-95")}
                  strokeWidth={active ? 2.6 : 2}
                />
              </span>
              <span className={cn("leading-none", active ? "font-bold text-[#23682E]" : "text-muted")}>{item.label}</span>
            </Link>
          );
        })}

        <button onClick={openCart} className="relative -mt-4 flex flex-col items-center" aria-label="Open cart">
          <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-gradient-to-br from-[#2E8B3D] to-[#23682E] text-white shadow-lg shadow-[#2D7D3A]/30 ring-4 ring-white">
            <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={2.5} />
            {count > 0 && (
              <span className="absolute -right-0.5 top-0 -translate-y-1/3 translate-x-1/3 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F5A623] px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-white">
                {count}
              </span>
            )}
          </div>
          <span className="mt-1 text-[10px] font-bold text-[#23682E]">Cart</span>
        </button>
      </div>
    </nav>
  );
}