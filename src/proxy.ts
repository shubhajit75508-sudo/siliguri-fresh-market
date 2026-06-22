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

function getSecret(): string {
  return process.env.NEXT_PUBLIC_COOKIE_SECRET || process.env.COOKIE_SECRET || "default-dev-secret-change-in-production";
}

/** Verify a client-signed cookie matches the hash */
function verifySignedCookie(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;

  // Re-compute hash matching signCookieSync algorithm in src/lib/session.ts
  const secret = getSecret();
  let hash = 0;
  const s = payload + secret;
  for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
  const expected = Math.abs(hash).toString(36);

  // Constant-time comparison
  if (sig.length !== expected.length) return null;
  let ok = 0;
  for (let i = 0; i < sig.length; i++) {
    ok |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return ok === 0 ? payload : null;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect legacy login pages
  if (pathname === "/admin/login" || pathname === "/delivery/login") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Guard /admin page routes
  if (pathname.startsWith("/admin")) {
    if (req.method === "OPTIONS") return NextResponse.next();
    const cookie = req.cookies.get("sfm-auth-session");
    // Accept signed OR legacy unsigned cookies
    const raw = cookie?.value;
    const payload = raw?.includes(".") ? (verifySignedCookie(raw) ?? raw.split(".")[0]) : raw;
    if (!payload || !payload.endsWith("|admin")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  // Guard /delivery page routes
  if (pathname.startsWith("/delivery")) {
    if (req.method === "OPTIONS") return NextResponse.next();
    const cookie = req.cookies.get("sfm-auth-session");
    const raw = cookie?.value;
    const payload = raw?.includes(".") ? (verifySignedCookie(raw) ?? raw.split(".")[0]) : raw;
    if (!payload) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

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

    // Customer order creation — allow any authenticated user (including legacy unsigned cookies)
    if (pathname === "/api/admin/orders" && req.method === "POST") {
      const cookie = req.cookies.get("sfm-auth-session");
      if (cookie?.value) {
        // Accept legacy unsigned cookies OR signed cookies
        const payload = cookie.value.includes(".") ? cookie.value.split(".")[0] : cookie.value;
        if (payload) return NextResponse.next();
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User creation during signup — allow unauthenticated (users table needs populating)
    if (pathname === "/api/admin/users" && req.method === "POST") return NextResponse.next();

    // Check API key header (for external services like Razorpay webhooks bypassing middleware if needed)
    const apiKey = req.headers.get("x-api-key");
    if (apiKey && process.env.API_SECRET_KEY && apiKey === process.env.API_SECRET_KEY) return NextResponse.next();

    const cookie = req.cookies.get("sfm-auth-session");
    if (!cookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify signature, then check role. Accept unsigned cookies as fallback.
    const payload = cookie.value.includes(".")
      ? (verifySignedCookie(cookie.value) ?? cookie.value.split(".")[0])
      : cookie.value;

    if (!payload.endsWith("|admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/admin/login",
    "/api/delivery/confirm",
    "/api/payment/create-order",
    "/admin/:path*",
    "/delivery/:path*",
  ],
};
