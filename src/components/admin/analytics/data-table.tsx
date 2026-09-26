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
  /** Hide this column in the stacked phone layout to keep cards readable. */
  hideOnMobile?: boolean;
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

  const SortIcon = ({ col }: { col: Column<T> }) =>
    sort?.key === col.key ? (
      sort.dir === "asc" ? <ArrowUp className="h-3 w-3 text-[#ff7a1a]" /> : <ArrowDown className="h-3 w-3 text-[#ff7a1a]" />
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-30" />
    );

  return (
    <div className="adm-panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b adm-hairline p-3 sm:gap-3 sm:p-4">
        {searchable && (
          <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a737f]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[#6a737f] focus:border-[#ff7a1a] sm:py-2"
            />
          </div>
        )}
        <div className="flex flex-1 items-center justify-between gap-2 sm:flex-none">
          <span className="adm-num text-[11px] text-[#98a2b0] sm:text-xs">
            {sorted.length} {sorted.length === 1 ? "row" : "rows"}
            {query && rows.length !== sorted.length ? ` of ${rows.length}` : ""}
          </span>
          {exportName && (
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[11px] font-semibold text-[#98a2b0] transition-colors hover:border-[#ff7a1a]/50 hover:text-[#ff7a1a]"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="p-10 text-center text-sm text-[#98a2b0]">
          {query ? "No rows match your search." : emptyMessage}
        </p>
      ) : (
        <>
          {/* One table serves both layouts: on phones each row stacks into a card
              (display:block) and every cell shows its own column label. Keeping a
              single <table> means the totals <tfoot> stays valid at every width. */}
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead className="hidden md:table-header-group">
                <tr className="border-b adm-hairline bg-[#0f1116]">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                      className={`whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#7d8794] ${alignCls(c.align)} ${c.headerClassName ?? ""}`}
                    >
                      {c.sortValue ? (
                        <button
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1.5 transition-colors hover:text-[#ff7a1a]"
                        >
                          {c.header}
                          <SortIcon col={c} />
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {view.map((r) => (
                  <tr
                    key={rowKey(r)}
                    className="block border-b border-white/[0.06] transition-colors last:border-0 hover:bg-[#ff7a1a]/[0.04] md:table-row md:border-b"
                  >
                    {columns.map((c, i) => (
                      <td
                        key={c.key}
                        className={`flex items-start justify-between gap-4 px-3.5 py-2 md:table-cell md:px-4 md:py-3 ${
                          c.hideOnMobile ? "hidden md:table-cell" : ""
                        } ${alignCls(c.align)} ${c.className ?? ""}`}
                      >
                        <span className="adm-eyebrow shrink-0 pt-0.5 md:hidden">{c.header}</span>
                        <span
                          className={`min-w-0 text-right text-[13px] md:text-inherit ${
                            i === 0 ? "font-semibold text-foreground md:font-normal" : "text-[#c9cfd8] md:font-normal"
                          }`}
                        >
                          {c.render(r)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {footer && (
                <tfoot className="block border-t-2 border-[#ff7a1a]/30 bg-white/[0.03] font-semibold md:table-footer-group">
                  {footer}
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 border-t adm-hairline p-3">
          <p className="adm-num text-[11px] text-[#98a2b0] sm:text-xs">
            Page {safePage} / {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-[#ff7a1a]/50 disabled:opacity-35 sm:px-3"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Prev</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}
              aria-label="Next page"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-[#ff7a1a]/50 disabled:opacity-35 sm:px-3"
            >
              <span className="hidden sm:inline">Next</span> <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
