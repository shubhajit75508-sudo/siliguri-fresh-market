import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "@/lib/admin-creds";
import bcrypt from "bcryptjs";

function getAdminPasswordHash(email: string): string | null {
  for (let i = 0; i < ADMIN_EMAILS.length; i++) {
    if (ADMIN_EMAILS[i] === email) {
      return process.env[`ADMIN_PASSWORD_${i + 1}`] ?? null;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (!ADMIN_EMAILS.includes(email)) {
      // Use same generic message to not reveal which emails are admin
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const storedHash = getAdminPasswordHash(email);
    if (!storedHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Support both bcrypt hashes and plain-text fallback during transition
    let valid = false;
    if (storedHash.startsWith("$2")) {
      valid = await bcrypt.compare(password, storedHash);
    } else {
      // Legacy plain-text comparison — will be removed after hashes are deployed
      valid = storedHash === password;
    }
    if (!valid) {
      // Delay to slow down brute-force (complementing rate limit)
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    let userId = "admin-" + crypto.randomUUID();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabaseAdmin = createClient(url, key);
      const { data } = await supabaseAdmin.auth.admin.listUsers();
      const match = data?.users.find((u) => u.email === email);
      if (match) userId = match.id;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name: email.split("@")[0],
        role: "admin",
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
