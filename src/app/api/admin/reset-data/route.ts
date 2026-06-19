import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_CREDS } from "@/lib/admin-creds";

const adminEmails = new Set(ADMIN_CREDS.map((c) => c.email));

function checkAuth(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey === process.env.API_SECRET_KEY) return null;

  const cookie = req.cookies.get("sfm-auth-session");
  if (cookie?.value) {
    const [, role] = cookie.value.split("|");
    if (role === "admin") return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const unauthorized = checkAuth(req);
  if (unauthorized) return unauthorized;

  try {
    const { confirm } = await req.json();
    if (confirm !== "RESET_ALL_DATA") {
      return NextResponse.json({ error: "Missing confirmation token" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, key);

    const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

    const nonAdminUsers = authData.users.filter((u) => !adminEmails.has(u.email ?? ""));

    // Delete all rows from public.users table
    const { error: deleteError } = await supabaseAdmin.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    // Ban then unban each non-admin user to revoke all their sessions (forces logout)
    const results: { email: string; status: string }[] = [];
    for (const user of nonAdminUsers) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
        await supabaseAdmin.auth.admin.updateUserById(user.id, { ban_duration: "" });
        results.push({ email: user.email ?? user.id, status: "logged_out" });
      } catch (e) {
        results.push({ email: user.email ?? user.id, status: `error: ${e}` });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data reset complete. All non-admin users have been logged out.",
      totalNonAdminUsers: nonAdminUsers.length,
      details: results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}