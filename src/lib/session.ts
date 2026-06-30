// HMAC-signed cookie utility — server-side signing only
// The secret is NEVER exposed to the browser. All signing happens via API routes.
// For production, migrate to a proper auth framework (NextAuth, Supabase Auth, etc.)

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error(
      "COOKIE_SECRET must be set in environment variables. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return secret;
}

// HMAC-SHA256 signing using Web Crypto API (Edge Runtime compatible)
async function hmacSign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Create a signed session token: "payload.signature" using HMAC-SHA256 */
export async function signSessionToken(payload: string): Promise<string> {
  const secret = getSecret();
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
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

/** Verify a signed token. Returns the payload if valid, null if invalid. */
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
