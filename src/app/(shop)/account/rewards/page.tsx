"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Star, Coins, ShoppingBag } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

export default function RewardsPage() {
  const { user, activityLog, applyCoinsRedemption, coinsRedeemed } = useUserStore();
  const { setCoinsDiscount } = useCartStore();
  const router = useRouter();
  const toast = useToast();
  const [selectedCoins, setSelectedCoins] = useState(0);

  const balance = user?.loyaltyPoints ?? 0;
  const discountPerUnit = 50; // 100 coins = ₹50
  const minCoins = 100;
  const maxRedeemable = Math.floor(balance / 100) * 100;

  const applyToCart = () => {
    if (selectedCoins < minCoins) {
      toast.add("Minimum 100 coins to redeem", "error");
      return;
    }
    const discount = (selectedCoins / 100) * discountPerUnit;
    applyCoinsRedemption(selectedCoins);
    setCoinsDiscount(discount);
    toast.add(`${selectedCoins} coins applied — ₹${discount} off`);
    router.push("/checkout");
  };

  return (
    <div>
      {/* Balance card */}
      <div className="glass-card rounded-2xl p-6 text-center">
        <Coins className="mx-auto h-10 w-10 text-brand-orange" />
        <p className="mt-3 text-3xl font-extrabold text-white">
          {balance.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-muted">Coins</p>
        <div className="mt-3 flex justify-center gap-4 text-xs text-muted">
          <span>Earn: ₹100 = <strong className="text-white">10</strong> coins</span>
          <span>Redeem: <strong className="text-white">100</strong> coins = ₹50</span>
        </div>
      </div>

      {/* Redeem section */}
      {balance >= minCoins && (
        <div className="mt-6 rounded-2xl border border-border bg-[#0d1b2a] p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Gift className="h-4 w-4 text-brand-orange" />
            Redeem Your Coins
          </h3>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Select coins</span>
              <span className="font-semibold">{selectedCoins.toLocaleString()} coins = ₹{(selectedCoins / 100 * discountPerUnit).toFixed(0)} off</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxRedeemable}
              step={100}
              value={selectedCoins}
              onChange={(e) => setSelectedCoins(Number(e.target.value))}
              className="mt-2 w-full accent-brand-fresh"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>0</span>
              <span>{maxRedeemable.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="default" size="sm" onClick={applyToCart} disabled={selectedCoins < minCoins}>
              <ShoppingBag className="mr-1 h-4 w-4" /> Apply to Cart
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedCoins(0)}>
              Reset
            </Button>
          </div>
          {coinsRedeemed > 0 && (
            <p className="mt-2 text-xs text-brand-fresh">
              {coinsRedeemed} coins currently applied in checkout
            </p>
          )}
        </div>
      )}

      {balance < minCoins && (
        <div className="mt-6 rounded-2xl border border-border bg-[#0d1b2a] p-5 text-center text-sm text-muted">
          Earn {minCoins - balance} more coins to start redeeming
        </div>
      )}

      {/* Activity */}
      <h3 className="mb-3 mt-6 text-sm font-bold">Recent Activity</h3>
      <div className="space-y-2">
        {activityLog.length === 0 ? (
          <p className="text-sm text-muted">No activity yet</p>
        ) : (
          activityLog.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-white/8 p-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <Star className={`h-4 w-4 ${item.coins > 0 ? "text-brand-orange" : "text-muted"}`} />
                {item.action}
              </div>
              <div className="text-right">
                <span className={`font-bold ${item.coins > 0 ? "text-brand-fresh" : "text-brand-red"}`}>
                  {item.coins > 0 ? "+" : ""}{item.coins}
                </span>
                <p className="text-xs text-muted">{item.date}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
