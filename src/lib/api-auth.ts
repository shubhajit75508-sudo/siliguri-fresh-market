import { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

/** Get and verify a session token. Returns payload or null.
 *  Only HMAC-signed tokens are accepted — unsigned tokens are rejected. */
export async function getSession(req: NextRequest): Promise<string | null> {
  // Web: cookie. Native (React Native/Expo) apps have no cookie jar, so they
  // send the same signed token in an `Authorization: Bearer` header instead.
  const cookie = req.cookies.get("sfm-auth-session")?.value;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  const token = cookie || bearer;
  if (!token) return null;
  return verifySessionToken(token);
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

/** Require staff (admin or manager) — returns userId or null */
export async function requireStaff(req: NextRequest): Promise<string | null> {
  const auth = await requireAuth(req);
  if (!auth || (auth.role !== "admin" && auth.role !== "manager")) return null;
  return auth.userId;
}
