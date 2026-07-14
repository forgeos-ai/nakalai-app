/**
 * Vercel Edge Middleware — rate limiting + security headers.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const RATE_LIMIT_MESSAGE =
  'Too many submission attempts. Please wait a few minutes.';

const RATE_LIMITED_PATHS = [
  '/api/leads',
  '/api/downloads/authorize',
  '/api/payments/create-order',
  '/api/payments/verify',
];

function readPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function clientIp(request: NextRequest): string {
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

function isWriteMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH';
}

function shouldRateLimit(pathname: string): boolean {
  return RATE_LIMITED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function applySecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)',
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdnjs.cloudflare.com https://pagead2.googlesyndication.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://cdnjs.cloudflare.com https://pagead2.googlesyndication.com",
    "worker-src 'self' blob: https://cdnjs.cloudflare.com",
    "frame-src https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
}

export default function middleware(request: NextRequest): Response {
  const pathname = request.nextUrl.pathname;

  if (isWriteMethod(request.method) && shouldRateLimit(pathname)) {
    const max = readPositiveInt(process.env.LEAD_RATE_LIMIT_MAX, 5);
    const windowMs = readPositiveInt(process.env.LEAD_RATE_LIMIT_WINDOW_MS, 60_000);
    const ip = clientIp(request);
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
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}
