"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Menu, X, UserPlus, Truck } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { SearchBar } from "@/components/search/search-bar";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getItemCount, openCart } = useCartStore();
  const { currentUser } = useAuthStore();
  const hydrated = useHydrated();
  const itemCount = hydrated ? getItemCount() : 0;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Desktop */}
        <div className="hidden h-[68px] items-center gap-6 lg:flex">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-fresh/20">            <Image src="https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg" alt="SFM" width={40} height={40} className="h-10 w-10 object-contain rounded-xl" /></div>
            <div className="flex flex-col">
              <span className="text-[15px] font-extrabold text-foreground leading-tight">Siliguri</span>
              <span className="text-[10px] font-bold text-brand-fresh uppercase tracking-wider leading-tight">Fresh Mart</span>
            </div>
          </Link>

          <div className="mx-auto w-full max-w-[520px]">
            <SearchBar />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {currentUser ? (
              <>
                <Link
                  href={currentUser.role === "admin" ? "/admin" : currentUser.role === "delivery" ? "/delivery" : "/account"}
                  className="flex h-10 items-center gap-2 rounded-full btn-secondary px-3 pl-1.5"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark text-[11px] font-bold text-white">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="max-w-[88px] truncate pr-1 text-[13px] font-medium">
                    {currentUser.name.split(" ")[0]}
                  </span>
                </Link>
                {currentUser.role === "admin" && (
                  <Link href="/admin/delivery" className="hidden lg:flex h-10 items-center gap-1.5 rounded-full border border-brand-fresh/30 bg-brand-fresh/5 px-3 text-[12px] font-medium text-brand-fresh-dim hover:bg-brand-fresh/10">
                    <Truck className="h-3.5 w-3.5" /> Delivery
                  </Link>
                )}
                {currentUser.role === "delivery" && (
                  <Link href="/delivery" className="hidden lg:flex h-10 items-center gap-1.5 rounded-full border border-brand-fresh/30 bg-brand-fresh/5 px-3 text-[12px] font-medium text-brand-fresh-dim hover:bg-brand-fresh/10">
                    <Truck className="h-3.5 w-3.5" /> Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  className="hidden lg:flex h-10 items-center gap-1.5 rounded-full btn-secondary px-3 text-[13px] font-medium"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Sign Up
                </Link>
                <Link
                  href="/auth/login"
                  className="flex h-10 items-center rounded-full border border-brand-fresh/30 bg-brand-fresh/5 px-4 text-[13px] font-semibold text-brand-fresh-dim transition-all hover:bg-brand-fresh/10 hover:shadow-sm"
                >
                  Log In
                </Link>
              </>
            )}

            <button
              onClick={openCart}
              className="flex h-10 items-center gap-2 rounded-xl btn-primary px-5 text-[13px] font-semibold"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
              Cart
              {itemCount > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F5A623] px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile — marketplace app bar */}
        <div className="-mx-4 bg-gradient-to-r from-[#1F6230] to-[#2D7D3A] px-4 pt-2 pb-2.5 sm:-mx-6 sm:px-6 lg:hidden">
          <div className="flex h-12 items-center gap-2.5">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25">
                <Image src="https://res.cloudinary.com/dc5fh5afb/image/upload/v1782216119/WhatsApp_Image_2026-06-23_at_5.21.54_PM_mfd9v2.jpg" alt="SFM" width={40} height={40} className="h-9 w-9 object-contain" />
              </div>
              <div className="min-w-0 leading-none">
                <div className="truncate text-[15px] font-extrabold text-white tracking-tight">Siliguri</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FFD98A]">Fresh Mart</div>
              </div>
            </Link>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {currentUser ? (
                <Link
                  href={currentUser.role === "admin" ? "/admin" : currentUser.role === "delivery" ? "/delivery" : "/account"}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 text-[11px] font-bold text-white"
                >
                  {currentUser.name.charAt(0)}
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex h-9 items-center rounded-xl bg-white px-3.5 text-[12px] font-bold text-[#23682E] shadow-sm"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex h-9 items-center rounded-xl border border-white/40 px-3.5 text-[12px] font-semibold text-white"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              <button
                onClick={openCart}
                aria-label="Open cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 text-white"
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.5} />
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F5A623] px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-[#F5A623]/40">
                    {itemCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 text-white"
              >
                {mobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <div className="pb-0.5 pt-1.5">
            <SearchBar />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: 500, opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-white lg:hidden"
          >
            <div className="space-y-0.5 p-3">
              {[
                { href: "/", label: "Home" },
                { href: "/fish", label: "Fresh Fish" },
                { href: "/category/chicken", label: "Chicken & Mutton" },
                { href: "/category/pork", label: "Pork" },
                { href: "/category/vegetables", label: "Farm Fresh" },
                { href: "/bulk", label: "Bulk Order" },
                ...(currentUser?.role === "admin"
                  ? [
                      { href: "/admin", label: "Admin Panel" },
                      { href: "/admin/delivery", label: "Manage Delivery" },
                    ]
                  : currentUser?.role === "delivery"
                  ? [
                      { href: "/delivery", label: "Delivery Dashboard" },
                    ]
                  : currentUser?.role === "customer"
                  ? [
                      { href: "/account", label: "My Account" },
                    ]
                  : []),
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-2"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}