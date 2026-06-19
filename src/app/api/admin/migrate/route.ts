import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const supabase = createClient(url, key);

  const results: string[] = [];

  try {
    const { error: e1 } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';",
    });
    results.push(e1 ? `payment_status: ${e1.message}` : "payment_status: OK");

    const { error: e2 } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check; ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','received','out_for_delivery','delivered','cancelled'));",
    });
    results.push(e2 ? `status check: ${e2.message}` : "status check: OK");
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({
      note: "exec_sql RPC not available. Run SQL manually in Supabase Dashboard.",
      error: err.message,
      sql: [
        "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';",
        "ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;",
        "ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','received','out_for_delivery','delivered','cancelled'));",
        "ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;",
      ],
    });
  }

  return NextResponse.json({ success: true, results });
}
