// Simple HMAC-signed cookie utility for session security

function getSecret(): string {
  return process.env.COOKIE_SECRET || "default-dev-secret-change-in-production";
}

/** Simple client-side cookie signing using a hash */
export function signCookieSync(value: string): string {
  if (typeof window === "undefined") return value;
  const secret = getSecret();
  let hash = 0;
  const s = value + secret;
  for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
  return `${value}.${Math.abs(hash).toString(36)}`;
}

// Basic HMAC using SubtleCrypto when available, fallback to simple hash
async function hmacSign(message: string, secret: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  let hash = 0;
  const s = message + secret;
  for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(36);
}

/** Create a signed cookie value: "payload.signature" */
export async function signSessionToken(payload: string): Promise<string> {
  const secret = getSecret();
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

/** Verify a signed cookie value. Returns the payload if valid, null if invalid. */
export async function verifySessionToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = await hmacSign(payload, getSecret());
  if (sig.length !== expected.length) return null;
  let ok = true;
  for (let i = 0; i < sig.length; i++) {
    if (sig[i] !== expected[i]) ok = false;
  }
  return ok ? payload : null;
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
