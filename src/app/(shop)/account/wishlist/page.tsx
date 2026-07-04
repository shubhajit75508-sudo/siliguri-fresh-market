"use client";

import { ProductCard } from "@/components/product/product-card";
import { useProducts } from "@/lib/hooks/use-products";
import { useUserStore } from "@/store/user-store";
import { Share2 } from "lucide-react";

export default function WishlistPage() {
  const { data: allProducts = [] } = useProducts();
  const { wishlist } = useUserStore();
  const wishlistProducts = allProducts.filter((p) => wishlist.includes(p.id));

  const shareOnWhatsApp = () => {
    if (wishlistProducts.length === 0) return;
    const text = wishlistProducts.map((p) => p.name).join(", ");
    const url = `https://wa.me/?text=${encodeURIComponent(`Check out my wishlist on Siliguri Fresh Mart: ${text}`)}`;
    window.open(url, "_blank");
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Wishlist</h2>
        {wishlistProducts.length > 0 && (
          <button onClick={shareOnWhatsApp} className="flex items-center gap-1.5 rounded-full bg-brand-fresh/10 px-3 py-1.5 text-xs font-semibold text-brand-fresh hover:bg-brand-fresh/20">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        )}
      </div>
      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {wishlistProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-muted">
            Tap the heart icon on products to save them here
          </p>
        </div>
      )}
    </div>
  );
}
