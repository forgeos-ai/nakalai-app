/**
 * Vercel Edge Middleware — lead-submission rate limiting outline.
 *
 * Protects free-tier Supabase from automated lead-injection / script abuse by
 * throttling write traffic to profile / metrics commit paths at the edge.
 *
 * Deploy from this project root on Vercel. Tune via env:
 *   LEAD_RATE_LIMIT_MAX, LEAD_RATE_LIMIT_WINDOW_MS
 * Global IP shielding: see `.env.example` + `docs/vercel-edge-security.md`.
 *
 * Note: This file is Edge-only (not part of the Vite `src` bundle). Local
 * `tsc` / `vite build` intentionally ignore it.
 */

export const config = {
  matcher: [
    '/api/leads',
    '/api/leads/(.*)',
    '/api/student-profiles',
    '/api/student-profiles/(.*)',
    '/api/profiles',
    '/api/profiles/(.*)',
  ],
};

type Bucket = {
  count: number;
  resetAt: number;
};

/** Per-isolate sliding window. Pair with Vercel WAF for fleet-wide IP limits. */
const buckets = new Map<string, Bucket>();

const RATE_LIMIT_MESSAGE =
  'Too many submission attempts. Please wait a few minutes.';

function readPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function tooManyRequestsResponse(retryAfterSec: number): Response {
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

function isLeadCommitMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH';
}

/**
 * Edge entry. Returns HTTP 429 JSON when the IP exceeds the window threshold.
 * Returning `void` lets Vercel continue the request to the matched API route.
 */
export default function middleware(request: Request): Response | void {
  if (!isLeadCommitMethod(request.method)) {
    return;
  }

  const max = readPositiveInt(
    typeof process !== 'undefined' ? process.env?.LEAD_RATE_LIMIT_MAX : undefined,
    5,
  );
  const windowMs = readPositiveInt(
    typeof process !== 'undefined'
      ? process.env?.LEAD_RATE_LIMIT_WINDOW_MS
      : undefined,
    60_000,
  );

  const ip = clientIp(request);
  const key = `${ip}:${new URL(request.url).pathname}`;
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
}
