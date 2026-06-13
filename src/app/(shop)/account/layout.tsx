"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Package,
  Heart,
  MapPin,
  Gift,
  Bell,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/user-store";

const accountLinks = [
  { href: "/account", icon: User, label: "Profile" },
  { href: "/account/orders", icon: Package, label: "Orders" },
  { href: "/account/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/account/addresses", icon: MapPin, label: "Addresses" },
  { href: "/account/rewards", icon: Gift, label: "Coins" },
  { href: "/account/notifications", icon: Bell, label: "Notifications" },
  { href: "/account/support", icon: Headphones, label: "Support" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUserStore();

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark text-xl font-bold text-white">
          {user?.name?.charAt(0) || "U"}
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{user?.name}</h1>
          <p className="text-sm text-muted">{user?.phone}</p>
        </div>
      </div>

      {/* Mobile nav — horizontal scroll */}
      <nav className="mb-6 -mx-4 overflow-x-auto px-4 no-scrollbar lg:hidden">
        <div className="flex gap-2 min-w-max">
          {accountLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-brand-dark text-white"
                    : "bg-surface text-muted hover:bg-border"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="grid gap-6 lg:grid-cols-4">
        <nav className="hidden lg:block">
          <div className="glass-card space-y-1 rounded-2xl p-3">
            {accountLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-dark text-white"
                      : "text-muted hover:bg-brand-dark/5 hover:text-brand-dark"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
