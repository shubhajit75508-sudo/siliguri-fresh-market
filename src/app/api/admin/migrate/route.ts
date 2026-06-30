import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const supabase = createClient(url, key);

  const results: string[] = [];
  const sql: string[] = [];

  const add = (label: string, statement: string) => {
    sql.push(statement);
    try { supabase.rpc("exec_sql", { sql: statement }).then(({ error }) => {
      results.push(error ? `${label}: FAILED` : `${label}: OK`);
    }); } catch { results.push(`${label}: skipped (exec_sql unavailable)`); }
  };

  add("payment_status column",
    "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';"
  );
  add("status check constraint",
    "ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check; ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','received','out_for_delivery','delivered','cancelled'));"
  );
  add("delivery_locations table",
    `CREATE TABLE IF NOT EXISTS public.delivery_locations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      delivery_boy_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      heading DOUBLE PRECISION DEFAULT 0,
      speed DOUBLE PRECISION DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  );
  add("unique index boy+order",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_locations_boy_order ON public.delivery_locations(delivery_boy_id, order_id);"
  );
  add("index delivery_boy_id",
    "CREATE INDEX IF NOT EXISTS idx_delivery_locations_boy ON public.delivery_locations(delivery_boy_id);"
  );
  add("index order_id",
    "CREATE INDEX IF NOT EXISTS idx_delivery_locations_order ON public.delivery_locations(order_id);"
  );
  add("realtime publication",
    "ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;"
  );

  return NextResponse.json({ sql, results });
}
