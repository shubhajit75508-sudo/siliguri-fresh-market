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
 */
export function DemandHeatmap({ dayLabels, hours, orders, revenue }: Props) {
  let peak = 0;
  for (const row of orders) for (const v of row) if (v > peak) peak = v;

  if (peak === 0) {
    return <p className="p-6 text-center text-sm text-muted">No orders in this period.</p>;
  }

  let best = { d: 0, h: 0, n: 0 };
  orders.forEach((row, d) =>
    row.forEach((n, h) => {
      if (n > best.n) best = { d, h, n };
    })
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <table className="border-separate" style={{ borderSpacing: 2 }}>
          <caption className="sr-only">Orders by day of week and hour of day</caption>
          <thead>
            <tr>
              <th scope="col" className="w-8" />
              {hours.map((h) => (
                <th key={h} scope="col" className="text-[9px] font-medium text-muted">
                  {hourLabel(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dayLabels.map((label, d) => (
              <tr key={label}>
                <th scope="row" className="pr-1 text-right text-[10px] font-medium text-muted">
                  {label.slice(0, 3)}
                </th>
                {hours.map((h) => {
                  const n = orders[d]?.[h] ?? 0;
                  const t = peak > 0 ? n / peak : 0;
                  const bg = n === 0 ? "#F5F8F5" : `rgba(45,125,58,${(0.1 + Math.sqrt(t) * 0.85).toFixed(3)})`;
                  return (
                    <td
                      key={h}
                      title={`${label} · ${hourLabel(h)}:00–${hourLabel(h)}:59\n${n} ${n === 1 ? "order" : "orders"} · ${inr(revenue[d]?.[h] ?? 0)}`}
                      className="h-6 w-6 rounded-[3px] border border-black/5"
                      style={{ backgroundColor: bg }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted">
        Darker = more orders. Busiest slot:{" "}
        <b className="text-foreground">
          {dayLabels[best.d]} {hourLabel(best.h)}:00
        </b>{" "}
        ({best.n} {best.n === 1 ? "order" : "orders"}).
      </p>
    </div>
  );
}
