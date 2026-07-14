/**
 * Request rate-limiting helpers (framework-agnostic).
 * Previously Next.js Edge Middleware — Vite/Vercel static hosting applies
 * security headers via vercel.json instead.
 */

export const RATE_LIMIT_MESSAGE =
  'Too many submission attempts. Please wait a few minutes.';

export const RATE_LIMITED_PATHS = [
  '/api/leads',
  '/api/downloads/authorize',
  '/api/payments/create-order',
  '/api/payments/verify',
] as const;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function readPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
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

export function tooManyRequestsResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({
      error: RATE_LIMIT_MESSAGE,
      code: 'RATE_LIMITED',
      retryAfterSeconds: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': String(retryAfterSec),
      },
    },
  );
}

export function isWriteMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH';
}

export function shouldRateLimit(pathname: string): boolean {
  return RATE_LIMITED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * In-memory rate limit check for serverless/API handlers.
 * Returns a 429 Response when limited, otherwise null.
 */
export function checkRateLimit(
  request: Request,
  pathname: string,
  max = readPositiveInt(
    typeof process !== 'undefined' ? process.env.LEAD_RATE_LIMIT_MAX : undefined,
    5,
  ),
  windowMs = readPositiveInt(
    typeof process !== 'undefined'
      ? process.env.LEAD_RATE_LIMIT_WINDOW_MS
      : undefined,
    60_000,
  ),
): Response | null {
  if (!isWriteMethod(request.method) || !shouldRateLimit(pathname)) {
    return null;
  }

  const ip = clientIpFromHeaders(request.headers);
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > max) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return tooManyRequestsResponse(retryAfterSec);
  }

  return null;
}
