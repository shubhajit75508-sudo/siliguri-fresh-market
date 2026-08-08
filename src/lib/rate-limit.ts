/** Simple in-memory sliding-window rate limiter.
 *  Suited for a single serverless instance; on multi-instance deploys this is
 *  per-instance only, which is an acceptable best-effort throttle for the
 *  admin/delivery surfaces. */
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (only meaningful when !allowed). */
  retryAfter: number;
}

export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    const oldest = recent[0];
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfter: 0 };
}
