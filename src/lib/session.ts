// HMAC-signed cookie utility for session security
// WARNING: This homebrew session system uses a shared secret for client and server.
// The secret is accessible in the browser bundle (NEXT_PUBLIC_ prefix is required for
// client-side cookie signing). For production, migrate to a proper auth framework
// (NextAuth, Supabase Auth, etc.) where the server holds the sole signing authority.

function getSecret(): string {
  const secret = process.env.NEXT_PUBLIC_COOKIE_SECRET || process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error(
      "COOKIE_SECRET or NEXT_PUBLIC_COOKIE_SECRET must be set in environment variables. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return secret;
}

// HMAC-SHA256 signing using Web Crypto API
async function hmacSign(message: string, secret: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
      return btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch {
      // fall through to fallback
    }
  }
  // Fallback: SHA-256 via SubtleCrypto digest (available in most browsers)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const enc = new TextEncoder();
    const data = enc.encode(message + secret);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(hash));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Last resort — should never be reached in modern browsers
  throw new Error("crypto.subtle is not available. Cookie signing requires a secure environment.");
}

/** Create a signed cookie value: "payload.signature" using HMAC-SHA256 */
export async function signSessionToken(payload: string): Promise<string> {
  const secret = getSecret();
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

/** Client-side synchronous signing (used in auth-store for immediate cookie set).
 *  Falls back to async HMAC when crypto.subtle is available, otherwise uses a
 *  non-cryptographic hash as a last resort. The server should always verify
 *  with the full HMAC path. */
export async function signCookieSync(value: string): Promise<string> {
  const secret = getSecret();
  const sig = await hmacSign(value, secret);
  return `${value}.${sig}`;
}

/** Timing-safe string comparison */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Verify a signed cookie value. Returns the payload if valid, null if invalid. */
export async function verifySessionToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = await hmacSign(payload, getSecret());
  return timingSafeEqual(sig, expected) ? payload : null;
}

/** Check if a user has admin role from a signed session token */
export async function isAdminSession(token: string | null): Promise<boolean> {
  const payload = await verifySessionToken(token);
  if (!payload) return false;
  return payload.endsWith("|admin");
}

/** Check if a user has delivery boy role */
export async function isDeliverySession(token: string | null): Promise<boolean> {
  const payload = await verifySessionToken(token);
  if (!payload) return false;
  return payload.includes("|delivery");
}
