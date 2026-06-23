"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, TrendingUp, Clock } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { useDebounce } from "@/lib/hooks/use-debounce";

const trending = ["Hilsa", "Tiger prawns", "Mutton curry cut", "Country chicken", "Farm tomato"];

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useUserStore();
  const debouncedQuery = useDebounce(query, 200);

  const { data: results = [] } = useQuery({
    queryKey: ["products", "search", debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const go = (q: string) => {
    if (!q.trim()) return;
    addToSearchHistory(q);
    setOpen(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go(query);
          }}
          placeholder="Search hilsa, prawns, mutton curry cut..."
          className="h-11 w-full rounded-full border border-border bg-surface pl-11 pr-12 text-[14px] transition-all placeholder:text-muted/80 focus:border-brand-fresh/40 focus:bg-[#0d1b2a] focus:outline-none focus:ring-4 focus:ring-brand-fresh/10"
        />
        <button
          type="button"
          disabled
          title="Voice search coming soon"
          aria-label="Voice search coming soon"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-not-allowed items-center justify-center rounded-full text-brand-fresh-dim opacity-40"
        >
          <Mic className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-[#0d1b2a] p-3 shadow-xl"
            >
              {results.length > 0 ? (
                results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => go(p.name)}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-surface"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                      <Image unoptimized src={p.image} alt="" fill className="object-cover product-img" sizes="40px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted">{formatPrice(p.price)}</p>
                    </div>
                  </button>
                ))
              ) : (
                <>
                  {searchHistory.length > 0 && (
                    <div className="mb-3">
                      <div className="mb-2 flex items-center justify-between px-1">
                        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                          <Clock className="h-3 w-3" /> Recent
                        </span>
                        <button onClick={clearSearchHistory} className="text-[11px] font-medium text-brand-fresh-dim">
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {searchHistory.map((q) => (
                          <button key={q} onClick={() => go(q)} className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium hover:bg-border">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="px-1">
                    <span className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <TrendingUp className="h-3 w-3" /> Trending
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {trending.map((q) => (
                        <button
                          key={q}
                          onClick={() => go(q)}
                          className="rounded-full border border-brand-fresh/20 bg-brand-fresh/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-fresh/10"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
