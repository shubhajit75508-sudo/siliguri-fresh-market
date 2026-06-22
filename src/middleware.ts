import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple rate limiting — in-memory (resets on cold start, fine for prototype)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit admin login
  if (pathname === "/api/admin/login" && req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`login-${ip}`, 5, 60 * 1000)) {
      return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
    }
  }

  // Rate limit delivery confirm
  if (pathname === "/api/delivery/confirm" && req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`confirm-${ip}`, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }
  }

  // Rate limit payment create
  if (pathname === "/api/payment/create-order" && req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`pay-${ip}`, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // Protect admin APIs
  if (pathname.startsWith("/api/admin")) {
    // Allow OPTIONS for CORS
    if (req.method === "OPTIONS") return NextResponse.next();

    const cookie = req.cookies.get("sfm-auth-session");

    // If no cookie, check for API key header (for external services)
    const apiKey = req.headers.get("x-api-key");
    if (apiKey === process.env.API_SECRET_KEY) return NextResponse.next();

    if (!cookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify signed cookie
    const payload = cookie.value.includes(".")
      ? cookie.value.split(".")[0]
      : cookie.value;

    if (!payload.endsWith("|admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/admin/login", "/api/delivery/confirm", "/api/payment/create-order"],
};
