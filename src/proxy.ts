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
  const secret = process.env.CACHE_COOKIE_SECRET
    || process.env.NEXT_PUBLIC_COOKIE_SECRET
    || process.env.COOKIE_SECRET;
  if (!secret) {
    console.error("COOKIE_SECRET environment variable is not set. Session security is disabled.");
    return "";
  }
  return secret;
}

/** Compute HMAC-SHA256 signature (synchronous — uses Node crypto in Edge runtime) */
async function hmacSign(message: string, secret: string): Promise<string> {
  // Edge Runtime: use Web Crypto API
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Legacy hash (String.hashCode) — used to verify old cookies during transition */
function legacyHash(payload: string, secret: string): string {
  let hash = 0;
  const s = payload + secret;
  for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(36);
}

/** Verify a signed cookie — tries HMAC first, falls back to legacy hash */
async function verifySignedCookie(token: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const secret = getSecret();
  if (!secret) return null;

  // Try HMAC-SHA256 first (new format)
  try {
    const expected = await hmacSign(payload, secret);
    // Constant-time comparison
    if (sig.length === expected.length) {
      let ok = 0;
      for (let i = 0; i < sig.length; i++) {
        ok |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
      }
      if (ok === 0) return payload;
    }
  } catch {
    // HMAC failed, try legacy hash
  }

  // Fallback: legacy hash (String.hashCode) — for backward compatibility
  const legacyExpected = legacyHash(payload, secret);
  if (sig.length === legacyExpected.length) {
    let ok = 0;
    for (let i = 0; i < sig.length; i++) {
      ok |= sig.charCodeAt(i) ^ legacyExpected.charCodeAt(i);
    }
    if (ok === 0) return payload;
  }

  return null;
}

/** Extract user payload from cookie, verifying signature if present */
async function getSessionPayload(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get("sfm-auth-session");
  if (!cookie?.value) return null;
  const raw = cookie.value;

  // Signed cookie (contains "." separator)
  if (raw.includes(".")) {
    const verified = await verifySignedCookie(raw);
    if (verified) return verified;
    // Verification failed — do NOT fall back to unsigned payload
    return null;
  }

  // Unsigned legacy cookie — accept only for backward compatibility
  // This path will be removed once all clients have been updated.
  return raw;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect legacy login pages
  if (pathname === "/admin/login" || pathname === "/delivery/login") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Guard /admin page routes
  if (pathname.startsWith("/admin")) {
    if (req.method === "OPTIONS") return NextResponse.next();
    const payload = await getSessionPayload(req);
    if (!payload || !payload.endsWith("|admin")) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  // Guard /delivery page routes
  if (pathname.startsWith("/delivery")) {
    if (req.method === "OPTIONS") return NextResponse.next();
    const payload = await getSessionPayload(req);
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

  // Rate limit auth endpoints
  if (pathname.startsWith("/api/auth") && req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`auth-${ip}`, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // Rate limit order creation
  if (pathname === "/api/orders" && req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`order-create-${ip}`, 20, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // Protect admin APIs
  if (pathname.startsWith("/api/admin")) {
    if (req.method === "OPTIONS") return NextResponse.next();

    // Customer order creation — allow any authenticated user
    if (pathname === "/api/admin/orders" && req.method === "POST") {
      const payload = await getSessionPayload(req);
      if (payload) return NextResponse.next();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User creation during signup — allow unauthenticated
    if (pathname === "/api/admin/users" && req.method === "POST") return NextResponse.next();

    // Product management — allow authenticated admins only
    if (pathname === "/api/admin/products" && (req.method === "POST" || req.method === "PUT" || req.method === "DELETE")) {
      const payload = await getSessionPayload(req);
      if (payload && payload.endsWith("|admin")) return NextResponse.next();
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check API key header (for external services)
    const apiKey = req.headers.get("x-api-key");
    if (apiKey && process.env.API_SECRET_KEY && apiKey === process.env.API_SECRET_KEY) return NextResponse.next();

    const payload = await getSessionPayload(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
    "/api/orders/:path*",
    "/api/delivery/confirm",
    "/api/delivery/location/:path*",
    "/api/payment/create-order",
    "/api/auth/:path*",
    "/admin/:path*",
    "/delivery/:path*",
  ],
};
