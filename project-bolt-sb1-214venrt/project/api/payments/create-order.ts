/**
 * Vercel Serverless — POST /api/payments/create-order
 * Web Handler (no default Node handler).
 */

import {
  assertRazorpayKeyMatchesMode,
  resolvePaymentMode,
} from '../../runtimeMode.ts';

export const runtime = 'nodejs';

const PACKAGES: Record<string, { amountInr: number; pages: number }> = {
  P3: { amountInr: 19, pages: 3 },
  P20: { amountInr: 49, pages: 20 },
  P75: { amountInr: 99, pages: 75 },
  P200: { amountInr: 199, pages: 200 },
  'std-10': { amountInr: 19, pages: 5 },
  'match-10': { amountInr: 49, pages: 5 },
  'std-75': { amountInr: 79, pages: 75 },
  'match-75': { amountInr: 109, pages: 75 },
};

const FORBIDDEN_AMOUNT_KEYS = [
  'amount',
  'amountPaise',
  'amountInr',
  'price',
  'currency',
];

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function readEnv(key: string): string {
  const value = process.env[key];
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^["']|["']$/g, '');
}

function getKeyId(): string {
  return readEnv('RAZORPAY_KEY_ID') || readEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID');
}

function getKeySecret(): string {
  return readEnv('RAZORPAY_KEY_SECRET');
}

function getServerPaymentMode() {
  const configuredMode =
    readEnv('PAYMENT_MODE') ||
    (readEnv('VERCEL_ENV') === 'production' ? 'LIVE' : '');
  return resolvePaymentMode(configuredMode);
}

function isConfigured(): boolean {
  const id = getKeyId();
  const secret = getKeySecret();
  return Boolean(
    id && secret && !id.includes('YOUR_') && !secret.includes('YOUR_'),
  );
}

function keyDiagnostics(): {
  keyIdPrefix: string;
  keyIdLen: number;
  secretLen: number;
} {
  const id = getKeyId();
  const secret = getKeySecret();
  return {
    keyIdPrefix: id ? id.slice(0, 8) : 'missing',
    keyIdLen: id.length,
    secretLen: secret.length,
  };
}

function clientIp(headers: Headers | Record<string, unknown> | undefined): string {
  try {
    if (headers && typeof (headers as Headers).get === 'function') {
      const h = headers as Headers;
      const forwarded = h.get('x-forwarded-for');
      if (forwarded) {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
      }
      return h.get('x-real-ip') || h.get('cf-connecting-ip') || 'unknown';
    }
    if (headers && typeof headers === 'object') {
      const raw = headers as Record<string, unknown>;
      const forwarded = raw['x-forwarded-for'];
      if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0]!.trim();
      }
      const real =
        (typeof raw['x-real-ip'] === 'string' && raw['x-real-ip']) ||
        (typeof raw['cf-connecting-ip'] === 'string' &&
          raw['cf-connecting-ip']) ||
        '';
      if (real) return real;
    }
  } catch {
    /* ignore */
  }
  return 'unknown';
}

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const max = 10;
  const windowMs = 60_000;
  const key = `${ip}:/api/payments/create-order`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfter: 0 };
}

type RazorpayOrder = { id: string; amount: number; currency: string };

async function createRazorpayOrder(params: {
  amountPaise: number;
  packageId: string;
  contentHash: string;
}): Promise<RazorpayOrder> {
  const keyId = getKeyId();
  const keySecret = getKeySecret();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured.');
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: 'INR',
      receipt: `nakalai_${params.packageId}_${Date.now()}`,
      notes: {
        package_id: params.packageId,
        content_hash: params.contentHash,
        source_app: 'nakalai',
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const diag = keyDiagnostics();
    console.error(
      JSON.stringify({
        event: 'razorpay-order-http-error',
        status: response.status,
        detailLength: detail.length,
        keyIdPrefix: diag.keyIdPrefix,
        keyIdLen: diag.keyIdLen,
        secretLen: diag.secretLen,
      }),
    );
    throw new Error(`Razorpay order failed (${response.status})`);
  }

  return (await response.json()) as RazorpayOrder;
}

/** Web Handler only — do not export default (Node req/res breaks Headers API). */
export async function POST(request: Request): Promise<Response> {
  const ip = clientIp(request.headers);
  const limited = rateLimit(ip);
  if (!limited.allowed) {
    return json(429, {
      error: 'Too many order requests. Please wait and try again.',
      code: 'RATE_LIMITED',
      retryAfterSeconds: limited.retryAfter,
    });
  }

  try {
    assertRazorpayKeyMatchesMode(getServerPaymentMode(), getKeyId());
  } catch (err) {
    console.error(
      '[NakalAI] Payment runtime rejected:',
      err instanceof Error ? err.message : 'invalid runtime configuration',
    );
    return json(503, {
      error: 'Payment runtime configuration is invalid.',
      code: 'RUNTIME_CONFIGURATION_ERROR',
    });
  }

  if (!isConfigured()) {
    return json(503, {
      error: 'Payment gateway is not configured.',
      code: 'PAYMENT_NOT_CONFIGURED',
    });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return json(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  }

  for (const key of FORBIDDEN_AMOUNT_KEYS) {
    if (key in body) {
      return json(400, {
        error: 'Client must not supply payment amounts.',
        code: 'VALIDATION_ERROR',
      });
    }
  }

  const packageId =
    typeof body.packageId === 'string' ? body.packageId.trim() : '';
  if (!packageId) {
    return json(400, {
      error: 'packageId is required.',
      code: 'VALIDATION_ERROR',
    });
  }

  const pkg = PACKAGES[packageId];
  if (!pkg) {
    return json(400, {
      error: 'Unknown package.',
      code: 'VALIDATION_ERROR',
    });
  }

  const amountPaise = Math.round(pkg.amountInr * 100);
  const contentHash =
    typeof body.contentHash === 'string' && body.contentHash.trim()
      ? body.contentHash.trim()
      : 'unbound';

  try {
    const order = await createRazorpayOrder({
      amountPaise,
      packageId,
      contentHash,
    });

    const publicKey = getKeyId();
    if (!publicKey) {
      return json(503, {
        error: 'Payment gateway is not configured.',
        code: 'PAYMENT_NOT_CONFIGURED',
      });
    }

    return json(200, {
      orderId: order.id,
      currency: 'INR',
      amount: amountPaise,
      publicKey,
      packageId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    const statusMatch = /Razorpay order failed \((\d+)\)/.exec(message);
    const upstreamStatus = statusMatch ? Number(statusMatch[1]) : undefined;
    console.error(
      JSON.stringify({
        event: 'create-order-failed',
        packageId,
        upstreamStatus: upstreamStatus ?? null,
      }),
    );
    return json(502, {
      error: 'Could not create payment order. Please try again.',
      code: 'ORDER_FAILED',
      ...(upstreamStatus ? { upstreamStatus } : {}),
      keyIdPrefix: keyDiagnostics().keyIdPrefix,
    });
  }
}
