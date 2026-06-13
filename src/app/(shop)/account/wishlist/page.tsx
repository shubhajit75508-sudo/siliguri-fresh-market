"use client";

import { ProductCard } from "@/components/product/product-card";
import { useProducts } from "@/lib/hooks/use-products";
import { useUserStore } from "@/store/user-store";

export default function WishlistPage() {
  const { data: allProducts = [] } = useProducts();
  const { wishlist } = useUserStore();
  const wishlistProducts = allProducts.filter((p) => wishlist.includes(p.id));

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Wishlist</h2>
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
