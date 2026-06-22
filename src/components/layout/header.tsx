"use client";

import Link from "next/link";
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
    <header className="sticky top-0 z-50 bg-[#0d1b2a]/95 shadow-[0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Desktop */}
        <div className="hidden h-[68px] items-center gap-6 lg:flex">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ecc71]/20">            <img src="https://res.cloudinary.com/dy9lll7y5/image/upload/v1782149339/file_0000000087d8720badb85aa7c5d2a499_ynyyyu.png" alt="SFM" className="h-10 w-10 object-contain rounded-xl" /></div>
            <div className="flex flex-col">
              <span className="text-[15px] font-extrabold text-white leading-tight">Siliguri</span>
              <span className="text-[10px] font-bold text-[#2ecc71] uppercase tracking-wider leading-tight">Fresh Mart</span>
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
                  className="flex h-10 items-center gap-2 rounded-full border border-border bg-[#0d1b2a] px-3 pl-1.5 transition-all hover:border-brand-dark/20 hover:shadow-sm"
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
                  className="hidden lg:flex h-10 items-center gap-1.5 rounded-full border border-border bg-[#0d1b2a] px-3 text-[13px] font-medium hover:bg-surface"
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
              className="flex h-10 items-center gap-2 rounded-full bg-brand-dark px-5 text-[13px] font-semibold text-white shadow-md shadow-brand-dark/20 transition-all hover:bg-brand-fresh-dim hover:shadow-lg hover:shadow-brand-dark/25 active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
              Cart
              {itemCount > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0d1b2a] px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex h-14 items-center gap-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2ecc71]/20"><img src="https://res.cloudinary.com/dy9lll7y5/image/upload/v1782149339/file_0000000087d8720badb85aa7c5d2a499_ynyyyu.png" alt="SFM" className="h-9 w-9 object-contain rounded-lg" /></div>
            <div className="leading-none">
              <div className="text-sm font-bold text-white">Siliguri</div>
              <div className="text-[10px] font-bold text-[#2ecc71] uppercase tracking-wider">Fresh Mart</div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            {currentUser ? (
              <Link
                href={currentUser.role === "admin" ? "/admin" : currentUser.role === "delivery" ? "/delivery" : "/account"}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white"
              >
                {currentUser.name.charAt(0)}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  className="flex h-8 items-center rounded-full border border-border px-2.5 text-[10px] font-medium"
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth/login"
                  className="flex h-8 items-center rounded-full border border-brand-fresh/30 bg-brand-fresh/5 px-3 text-[11px] font-semibold text-brand-fresh-dim"
                >
                  Log In
                </Link>
              </>
            )}
            <button
              onClick={openCart}
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-white"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0d1b2a] text-[8px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <SearchBar />
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: 500, opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border lg:hidden"
          >
            <div className="space-y-0.5 p-3">
              {[
                { href: "/", label: "Home" },
                { href: "/fish", label: "Fresh Fish" },
                { href: "/category/chicken", label: "Chicken & Mutton" },
                { href: "/category/vegetables", label: "Farm Fresh" },
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
                  className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-surface"
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
