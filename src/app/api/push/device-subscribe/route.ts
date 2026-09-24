import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Validate an Expo push token shape: "ExponentPushToken[...]" or "ExpoPushToken[...]". */
function isValidExpoToken(token: string): boolean {
  return /^Ex(ponent|po)PushToken\[[A-Za-z0-9_-]+\]$/.test(token.trim());
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { expoToken, platform } = await req.json();
  if (!expoToken || typeof expoToken !== "string" || !isValidExpoToken(expoToken)) {
    return NextResponse.json({ error: "Invalid expo token" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("device_push_subscriptions").upsert(
    {
      user_id: auth.userId,
      expo_token: expoToken.trim(),
      platform: platform === "ios" ? "ios" : "android",
    },
    { onConflict: "user_id,expo_token" }
  );
  if (error) return NextResponse.json({ error: "Failed to save device token" }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { expoToken } = await req.json();
  if (!expoToken || typeof expoToken !== "string") {
    return NextResponse.json({ error: "Missing expo token" }, { status: 400 });
  }

  await supabaseAdmin
    .from("device_push_subscriptions")
    .delete()
    .eq("user_id", auth.userId)
    .eq("expo_token", expoToken.trim());

  return NextResponse.json({ success: true });
}