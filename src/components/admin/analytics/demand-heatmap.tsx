"use client";

type Props = {
  dayLabels: string[];
  hours: number[];
  /** 7 rows × 24 columns of order counts. */
  orders: number[][];
  /** 7 rows × 24 columns of revenue. */
  revenue: number[][];
};

function hourLabel(h: number) {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/**
 * Order-density heatmap: day-of-week (rows) × hour-of-day (columns).
 * Cell colour is scaled to the busiest cell in the grid, and each cell exposes
 * the real order count and revenue via its tooltip.
 *
 * Colours are computed in JS rather than left to the theme because they encode a
 * continuous value — the admin theme only owns the static palette.
 */
export function DemandHeatmap({ dayLabels, hours, orders, revenue }: Props) {
  let peak = 0;
  for (const row of orders) for (const v of row) if (v > peak) peak = v;

  if (peak === 0) {
    return <p className="p-8 text-center text-sm text-muted">No orders in this period.</p>;
  }

  let best = { d: 0, h: 0, n: 0 };
  orders.forEach((row, d) =>
    row.forEach((n, h) => {
      if (n > best.n) best = { d, h, n };
    })
  );

  // Black → deep orange → bright orange, matching the console accent.
  const cellColor = (n: number) => {
    if (n === 0) return "#12151a";
    const t = n / peak;
    const a = 0.14 + Math.sqrt(t) * 0.72;
    return `rgba(255,122,26,${a.toFixed(3)})`;
  };

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
        <table className="border-separate" style={{ borderSpacing: 2 }}>
          <caption className="sr-only">Orders by day of week and hour of day</caption>
          <thead>
            <tr>
              <th scope="col" className="w-6" />
              {hours.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className={`text-[8px] font-semibold text-[#7d8794] sm:text-[9px] ${
                    // Hide the odd hours on phones so the 24 columns still fit.
                    h % 2 === 1 ? "hidden sm:table-cell" : ""
                  }`}
                >
                  {hourLabel(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dayLabels.map((label, d) => (
              <tr key={label}>
                <th
                  scope="row"
                  className="pr-1 text-right text-[9px] font-semibold uppercase tracking-wide text-[#7d8794] sm:text-[10px]"
                >
                  {label.slice(0, 3)}
                </th>
                {hours.map((h) => {
                  const n = orders[d]?.[h] ?? 0;
                  return (
                    <td
                      key={h}
                      title={`${label} · ${hourLabel(h)}:00–${hourLabel(h)}:59\n${n} ${n === 1 ? "order" : "orders"} · ${inr(revenue[d]?.[h] ?? 0)}`}
                      className={`h-5 w-5 rounded-[3px] border border-white/5 sm:h-6 sm:w-6 ${
                        h % 2 === 1 ? "hidden sm:table-cell" : ""
                      }`}
                      style={{ backgroundColor: cellColor(n) }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted">
          Brighter = more orders. Busiest slot:{" "}
          <b className="text-foreground">
            {dayLabels[best.d]} {hourLabel(best.h)}:00
          </b>{" "}
          ({best.n} {best.n === 1 ? "order" : "orders"}).
        </p>
        {/* Legend, so the scale is readable without hovering. */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-[#7d8794]">Low</span>
          <div className="flex gap-px">
            {[0.14, 0.3, 0.46, 0.62, 0.78, 0.86].map((a) => (
              <span
                key={a}
                className="h-3 w-3 rounded-[2px] border border-white/5"
                style={{ backgroundColor: `rgba(255,122,26,${a})` }}
              />
            ))}
          </div>
          <span className="text-[9px] uppercase tracking-wider text-[#7d8794]">Peak</span>
        </div>
      </div>
    </div>
  );
}
