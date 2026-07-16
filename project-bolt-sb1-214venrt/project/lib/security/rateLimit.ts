/**
 * In-memory rate limiting primitive for serverless handlers.
 * Wired: POST /api/payments/create-order
 * @see docs/security/api-security.md
 */

export type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function purgeExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Check and increment a rate limit bucket.
 * @param key - Typically `${clientIp}:${pathname}`
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  purgeExpired(now);

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const allowed = bucket.count <= config.max;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt - now) / 1000),
  );

  return {
    allowed,
    remaining: Math.max(0, config.max - bucket.count),
    retryAfterSeconds,
  };
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export function readRateLimitConfig(
  maxEnv: string | undefined,
  windowEnv: string | undefined,
  defaults: RateLimitConfig,
): RateLimitConfig {
  const max = Number(maxEnv);
  const windowMs = Number(windowEnv);
  return {
    max: Number.isFinite(max) && max > 0 ? Math.floor(max) : defaults.max,
    windowMs:
      Number.isFinite(windowMs) && windowMs > 0
        ? Math.floor(windowMs)
        : defaults.windowMs,
  };
}
