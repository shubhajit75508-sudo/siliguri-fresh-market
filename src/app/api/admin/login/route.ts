import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS, MANAGER_EMAILS } from "@/lib/admin-creds";
import bcrypt from "bcryptjs";
import { signSessionToken } from "@/lib/session";

type StaffRole = "admin" | "manager";

// Passwords are keyed by email so removing/reordering emails in the creds lists
// never shifts which stored hash an admin is validated against.
const ADMIN_PASSWORD_ENVS: Record<string, string> = {
  "shubhajit75508@gmail.com": "ADMIN_PASSWORD_1",
  "vaikaradigiital@gmail.com": "ADMIN_PASSWORD_3",
};

function getStaffPasswordHash(email: string, role: StaffRole): string | null {
  if (role === "manager") {
    return process.env.MANAGER_PASSWORD ?? null;
  }
  const envName = ADMIN_PASSWORD_ENVS[email] ?? null;
  return envName ? (process.env[envName] ?? null) : null;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const role: StaffRole | null = ADMIN_EMAILS.includes(email) ? "admin" : MANAGER_EMAILS.includes(email) ? "manager" : null;

    if (!role) {
      // Use same generic message to not reveal which emails are staff
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const storedHash = getStaffPasswordHash(email, role);
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

    let userId = (role === "manager" ? "manager-" : "admin-") + crypto.randomUUID();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabaseAdmin = createClient(url, key);
      const { data } = await supabaseAdmin.auth.admin.listUsers();
      const match = data?.users.find((u) => u.email === email);
      if (match) userId = match.id;
    }

    // Issue the signed session here — this endpoint already validated credentials.
    const token = await signSessionToken(`${userId}|${role}`);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        name: email.split("@")[0],
        role,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
