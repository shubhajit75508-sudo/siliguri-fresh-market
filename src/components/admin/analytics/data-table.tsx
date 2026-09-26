"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  /** Cell renderer. */
  render: (row: T) => React.ReactNode;
  /** Value used for sorting. Omit to make the column unsortable. */
  sortValue?: (row: T) => number | string;
  /** Value used for CSV export. Defaults to the rendered text if omitted. */
  csvValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  /** Unique key for each row, used for stable sorting. */
  rowKey: (row: T) => string;
  caption: string;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (row: T) => string;
  /** Filename (without extension) for the CSV download. */
  exportName?: string;
  emptyMessage?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  /** Rendered under the table, e.g. a totals row. */
  footer?: React.ReactNode;
};

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Search…",
  searchFields,
  exportName,
  emptyMessage = "No data in this period.",
  initialSort,
  footer,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchable) return rows;
    return rows.filter((r) => (searchFields ? searchFields(r) : JSON.stringify(r)).toLowerCase().includes(q));
  }, [rows, query, searchable, searchFields]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const view = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    setPage(1);
    setSort((s) => (s?.key !== key ? { key, dir: "desc" } : s.dir === "desc" ? { key, dir: "asc" } : null));
  };

  const downloadCsv = () => {
    const head = columns.map((c) => csvCell(c.header)).join(",");
    const body = sorted
      .map((r) => {
        const cells = columns.map((c) => {
          if (c.csvValue) return csvCell(c.csvValue(r));
          if (c.sortValue) return csvCell(c.sortValue(r));
          return csvCell("");
        });
        return cells.join(",");
      })
      .join("\n");
    const blob = new Blob([`﻿${head}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName ?? caption.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const alignCls = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="rounded-xl border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        {searchable && (
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-fresh"
            />
          </div>
        )}
        <span className="text-xs text-muted">
          {sorted.length} {sorted.length === 1 ? "row" : "rows"}
          {query && rows.length !== sorted.length ? ` (filtered from ${rows.length})` : ""}
        </span>
        {exportName && (
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-brand-fresh/5"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted">{query ? "No rows match your search." : emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b bg-muted/30">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted ${alignCls(c.align)} ${c.headerClassName ?? ""}`}
                  >
                    {c.sortValue ? (
                      <button
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {c.header}
                        {sort?.key === c.key ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.map((r) => (
                <tr key={rowKey(r)} className="border-b last:border-0 hover:bg-muted/20">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${alignCls(c.align)} ${c.className ?? ""}`}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {footer && <tfoot className="border-t-2 bg-muted/20 font-semibold">{footer}</tfoot>}
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t p-3">
          <p className="text-xs text-muted">
            Page {safePage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
