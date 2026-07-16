/**
 * Vercel Serverless — POST /api/payments/verify
 * Self-contained Web Handler (mirrors legacy app/api/payments/verify/route.ts).
 * Signature algorithm unchanged: HMAC_SHA256(order_id|payment_id).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  assertRazorpayKeyMatchesMode,
  resolvePaymentMode,
} from '../../runtimeMode.ts';

export const runtime = 'nodejs';

/** Same package table as create-order — never trust client amounts. */
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

const processedPayments = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const GRANT_TTL_MS = 5 * 60 * 1000;

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  packageId?: string;
  contentHash?: string;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  notes?: Record<string, string>;
};

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

function getDownloadTokenSecret(): string {
  return readEnv('DOWNLOAD_TOKEN_SECRET') || getKeySecret();
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

/** Legacy algorithm — HMAC_SHA256(order_id|payment_id), timing-safe compare. */
function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = getKeySecret();
  if (!secret || !orderId || !paymentId || !signature) return false;

  const body = `${orderId}|${paymentId}`;
  const expected = createHmac('sha256', secret).update(body).digest('hex');

  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function markPaymentProcessed(paymentId: string): boolean {
  const now = Date.now();
  for (const [id, exp] of processedPayments) {
    if (exp <= now) processedPayments.delete(id);
  }
  if (processedPayments.has(paymentId)) return false;
  processedPayments.set(paymentId, now + IDEMPOTENCY_TTL_MS);
  return true;
}

async function fetchRazorpayOrder(
  orderId: string,
): Promise<RazorpayOrder | null> {
  const keyId = getKeyId();
  const keySecret = getKeySecret();
  if (!keyId || !keySecret || !orderId) return null;

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(
    `https://api.razorpay.com/v1/orders/${orderId}`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!response.ok) return null;
  return (await response.json()) as RazorpayOrder;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function issuePaymentVerificationGrant(partial: {
  packageId: string;
  paymentId: string;
  orderId: string;
  amountPaise: number;
  contentHash: string;
}): Promise<string> {
  const secret = getDownloadTokenSecret();
  if (!secret) {
    throw new Error('HMAC secret is not configured');
  }

  const grant = {
    kind: 'payment_verification' as const,
    ...partial,
    exp: Date.now() + GRANT_TTL_MS,
    nonce:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `n_${Date.now()}`,
  };

  const payload = JSON.stringify(grant);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  return `${toBase64Url(new TextEncoder().encode(payload))}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function POST(request: Request): Promise<Response> {
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

  let body: VerifyBody;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return json(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
    }
    body = parsed as VerifyBody;
  } catch {
    return json(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  }

  const orderId = body.razorpay_order_id?.trim();
  const paymentId = body.razorpay_payment_id?.trim();
  const signature = body.razorpay_signature?.trim();
  const packageId = body.packageId?.trim();
  const contentHash = body.contentHash?.trim();

  if (!orderId || !paymentId || !signature) {
    return json(400, {
      error:
        'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      code: 'VALIDATION_ERROR',
    });
  }
  if (!packageId || !contentHash || contentHash.length < 8) {
    return json(400, {
      error: 'packageId and contentHash are required.',
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

  if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature)) {
    return json(403, {
      error: 'Razorpay signature verification failed.',
      code: 'SIGNATURE_INVALID',
    });
  }

  if (!markPaymentProcessed(paymentId)) {
    return json(409, {
      error: 'Payment has already been processed.',
      code: 'PAYMENT_REPLAY',
    });
  }

  const expectedPaise = Math.round(pkg.amountInr * 100);
  const order = await fetchRazorpayOrder(orderId);

  if (!order) {
    return json(502, {
      error: 'Could not fetch Razorpay order for amount validation.',
      code: 'ORDER_LOOKUP_FAILED',
    });
  }

  if (order.amount !== expectedPaise) {
    return json(403, {
      error: 'Paid amount does not match server-side package price.',
      code: 'AMOUNT_MISMATCH',
    });
  }

  const orderPackageId = order.notes?.package_id;
  const orderContentHash = order.notes?.content_hash;
  if (orderPackageId && orderPackageId !== packageId) {
    return json(403, {
      error: 'Order package does not match checkout selection.',
      code: 'PACKAGE_MISMATCH',
    });
  }
  if (orderContentHash && orderContentHash !== contentHash) {
    return json(403, {
      error: 'Order content hash does not match current assignment.',
      code: 'CONTENT_MISMATCH',
    });
  }

  let paymentVerificationToken: string;
  try {
    paymentVerificationToken = await issuePaymentVerificationGrant({
      packageId,
      paymentId,
      orderId,
      amountPaise: expectedPaise,
      contentHash,
    });
  } catch (err) {
    console.error(
      '[NakalAI] Payment grant issue failed:',
      err instanceof Error ? err.message : 'unknown',
    );
    return json(503, {
      error: 'Payment verification grant could not be issued.',
      code: 'GRANT_ISSUE_FAILED',
    });
  }

  return json(200, {
    ok: true,
    paymentVerificationToken,
    packageId,
    maxPages: pkg.pages,
    amountInr: pkg.amountInr,
    paymentId,
    orderId,
    expiresInSeconds: 300,
  });
}
