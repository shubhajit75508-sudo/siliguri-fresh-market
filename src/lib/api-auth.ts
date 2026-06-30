import { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

/** Get and verify session from request cookie. Returns payload or null.
 *  Accepts both HMAC-signed tokens and legacy unsigned cookies during transition. */
export async function getSession(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get("sfm-auth-session");
  if (!cookie?.value) return null;

  // Try HMAC-SHA256 verification first
  const verified = await verifySessionToken(cookie.value);
  if (verified) return verified;

  // Legacy unsigned cookie fallback (format: userId|role)
  const raw = cookie.value;
  if (!raw.includes(".") && raw.includes("|")) {
    const [userId, role] = raw.split("|");
    if (userId && role) return raw;
  }

  return null;
}

/** Extract userId from a verified session payload (format: "userId|role") */
export function getUserId(payload: string): string | null {
  return payload.split("|")[0] || null;
}

/** Extract role from a verified session payload */
export function getRole(payload: string): string | null {
  return payload.split("|")[1] || null;
}

/** Check if the session has admin role */
export async function isAdmin(req: NextRequest): Promise<boolean> {
  const payload = await getSession(req);
  if (!payload) return false;
  return payload.endsWith("|admin");
}

/** Check if the session has delivery role */
export async function isDelivery(req: NextRequest): Promise<boolean> {
  const payload = await getSession(req);
  if (!payload) return false;
  return payload.includes("|delivery");
}

/** Require authentication — returns 401 if no valid session */
export async function requireAuth(req: NextRequest): Promise<{ userId: string; role: string } | null> {
  const payload = await getSession(req);
  if (!payload) return null;
  const [userId, role] = payload.split("|");
  if (!userId || !role) return null;
  return { userId, role };
}

/** Require admin — returns 403 if not admin */
export async function requireAdmin(req: NextRequest): Promise<string | null> {
  const auth = await requireAuth(req);
  if (!auth || auth.role !== "admin") return null;
  return auth.userId;
}
