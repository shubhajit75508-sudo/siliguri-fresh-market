import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, verifySessionToken } from "@/lib/session";

/**
 * POST /api/auth/token
 * Server-side session token signing. The COOKIE_SECRET never leaves the server.
 * Accepts: { userId, role }
 * Returns: Set-Cookie header with signed session token
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
