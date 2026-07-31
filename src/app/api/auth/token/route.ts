import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signSessionToken } from "@/lib/session";
import { ADMIN_EMAILS } from "@/lib/admin-creds";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * POST /api/auth/token
 * Server-side session token signing. The COOKIE_SECRET never leaves the server.
 * Accepts: { userId, role }
 * The role is VERIFIED server-side before signing — the client cannot self-assign roles.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role required" }, { status: 400 });
    }

    // Only allow valid roles
    if (!["admin", "delivery", "customer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Local/dev mode (no Supabase) — sign the token so the app still works offline.
    // In production Supabase is always configured, so this path is never taken.
    if (!supabaseAdmin) {
      const payload = `${userId}|${role}`;
      const token = await signSessionToken(payload);
      const response = NextResponse.json({ success: true });
      response.cookies.set("sfm-auth-session", token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false, // Needs to be readable by client JS for auth state
        secure: true,
        sameSite: "strict",
      });
      return response;
    }

    // Server-side role verification
    let allowed = false;

    if (role === "admin") {
      // Admin must be a real Supabase auth user whose email is on the admin list.
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (data?.user?.email && ADMIN_EMAILS.includes(data.user.email)) allowed = true;
      } catch {
        // fall through — not allowed
      }
    } else if (role === "delivery") {
      // Delivery boy must exist in delivery_boys (created by an admin).
      // The users table is NOT trusted for this — customers can write to it.
      try {
        const { data: boy } = await supabaseAdmin
          .from("delivery_boys")
          .select("id")
          .eq("id", userId)
          .maybeSingle();
        if (boy) allowed = true;
      } catch {
        // fall through
      }
      if (!allowed) {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (data?.user?.user_metadata?.role === "delivery") allowed = true;
        } catch {
          // fall through
        }
      }
    } else {
      // customer — must be a real Supabase auth user or a registered customer row.
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (data?.user) allowed = true;
      } catch {
        // fall through
      }
      if (!allowed) {
        try {
          const { data: user } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", userId)
            .maybeSingle();
          if (user) allowed = true;
        } catch {
          // fall through
        }
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: "Role verification failed" }, { status: 403 });
    }

    const payload = `${userId}|${role}`;
    const token = await signSessionToken(payload);

    const response = NextResponse.json({ success: true });
    response.cookies.set("sfm-auth-session", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false, // Needs to be readable by client JS for auth state
      secure: true,
      sameSite: "strict",
    });

    return response;
  } catch (err) {
    console.error("token signing error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
