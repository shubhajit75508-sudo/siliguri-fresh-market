"use client";

import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

interface Review {
  name: string;
  area: string;
  rating: number;
  text: string;
}

const FALLBACK_REVIEWS: Review[] = [
  { name: "Priya Sharma", area: "Pradhan Nagar", rating: 5, text: "Khubsurat freshness, darun quality! Fish was spotless and delivered in 25 minutes." },
  { name: "Rahul Mukherjee", area: "Hakimpara", rating: 5, text: "Fatafati packing, on time. The chicken was farm-fresh, not frozen. Valo!" },
  { name: "Vikram Chettri", area: "Matigara", rating: 5, text: "Ekdom fresh. Best fish delivery in Siliguri! The Rohu was perfectly cleaned." },
  { name: "Sneha Pradhan", area: "Bagdogra", rating: 5, text: "Nice and fresh. Simple ordering, fast delivery. Very happy!" },
  { name: "Anjali Das", area: "Champasari", rating: 5, text: "Darun sweet prawns! Great job - arrived still cold in the insulated bag." },
  { name: "Amit Bose", area: "Siliguri Town", rating: 5, text: "Best online fish service in town. Prawns were large and fresh. Nice!" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "text-[#F5A623] fill-[#F5A623]" : "text-muted/30"}`} />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [page, setPage] = useState(0);
  const perPage = typeof window !== "undefined" && window.innerWidth >= 640 ? 3 : 1;
  const totalPages = Math.ceil(reviews.length / perPage);

  useEffect(() => {
    fetch("/reviews.json")
      .then((r) => r.json())
      .then((data: Review[]) => {
        if (Array.isArray(data) && data.length > 0) setReviews(data);
      })
      .catch(() => {});
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "4.8";

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title mb-1">Customer Reviews</h2>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "text-[#F5A623] fill-[#F5A623]" : "text-muted/30"}`} />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground">{avgRating}</span>
            <span className="text-xs text-muted">({reviews.length} reviews)</span>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-all hover:bg-surface hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-all hover:bg-surface hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {reviews.slice(page * perPage, page * perPage + perPage).map((review, i) => (
          <div
            key={`${review.name}-${i}`}
            className="relative rounded-2xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-[#2D7D3A]/20"
          >
            <Quote className="absolute right-3 top-3 h-8 w-8 text-[#2D7D3A]/8" />
            <StarRating rating={review.rating} />
            <p className="mt-2.5 text-sm text-foreground leading-relaxed line-clamp-3">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D7D3A]/10 text-[11px] font-bold text-[#2D7D3A]">
                {review.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{review.name}</p>
                <p className="text-[10px] text-muted">{review.area}, Siliguri</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a
          href="https://g.page/r/CYExample/review"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D7D3A] hover:underline"
        >
          See all reviews on Google
          <span className="text-[10px]">&#8599;</span>
        </a>
      </div>
    </section>
  );
}
