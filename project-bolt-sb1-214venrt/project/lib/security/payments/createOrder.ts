/**
 * Secure Razorpay order creation — server-only business logic.
 * @see docs/security/sprint-2b-phase-1-create-order.md
 */

import { jsonResponse } from '../apiResponse.js';
import {
  amountPaiseForPackage,
  ORDER_PACKAGE_IDS,
  isOrderPackageId,
  resolveOrderPackage,
} from '../canonicalPricing.js';
import {
  checkRateLimit,
  clientIpFromHeaders,
  readRateLimitConfig,
} from '../rateLimit.js';
import { safeLog } from '../safeLogger.js';
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from '../razorpay.js';
import {
  rejectClientAmountFields,
  requireEnum,
  requireNonEmpty,
  trimString,
} from '../validation.js';

export const CREATE_ORDER_PATH = '/api/payments/create-order';
export const MAX_CREATE_ORDER_BODY_BYTES = 4096;

export type CreateOrderSuccess = {
  orderId: string;
  currency: 'INR';
  amount: number;
  publicKey: string;
  packageId: string;
};

type CreateOrderBody = {
  packageId?: unknown;
  contentHash?: unknown;
  [key: string]: unknown;
};

function rateLimitResponse(retryAfterSeconds: number): Response {
  return jsonResponse(429, {
    error: 'Too many order requests. Please wait and try again.',
    code: 'RATE_LIMITED',
    retryAfterSeconds,
  });
}

async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: Response }
> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: jsonResponse(413, {
        error: 'Request body is too large.',
        code: 'VALIDATION_ERROR',
      }),
    };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: jsonResponse(400, {
        error: 'Could not read request body.',
        code: 'BAD_REQUEST',
      }),
    };
  }

  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: jsonResponse(413, {
        error: 'Request body is too large.',
        code: 'VALIDATION_ERROR',
      }),
    };
  }

  if (!raw.trim()) {
    return {
      ok: false,
      response: jsonResponse(400, {
        error: 'Request body is required.',
        code: 'BAD_REQUEST',
      }),
    };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        ok: false,
        response: jsonResponse(400, {
          error: 'Invalid JSON body.',
          code: 'BAD_REQUEST',
        }),
      };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      response: jsonResponse(400, {
        error: 'Invalid JSON body.',
        code: 'BAD_REQUEST',
      }),
    };
  }
}

/**
 * Handle POST /api/payments/create-order
 */
export async function handleCreateOrder(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse(405, {
      error: 'Method not allowed.',
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  const ip = clientIpFromHeaders(request.headers);
  const rateConfig = readRateLimitConfig(
    process.env.PAYMENT_RATE_LIMIT_MAX,
    process.env.PAYMENT_RATE_LIMIT_WINDOW_MS,
    { max: 10, windowMs: 60_000 },
  );
  const rate = checkRateLimit(`${ip}:${CREATE_ORDER_PATH}`, rateConfig);
  if (!rate.allowed) {
    safeLog('warn', 'create-order-rate-limited', { ip });
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  if (!isRazorpayConfigured()) {
    safeLog('warn', 'create-order-not-configured', {});
    return jsonResponse(503, {
      error: 'Payment gateway is not configured.',
      code: 'PAYMENT_NOT_CONFIGURED',
    });
  }

  const bodyResult = await readJsonBody(request, MAX_CREATE_ORDER_BODY_BYTES);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.body as CreateOrderBody;

  const amountReject = rejectClientAmountFields(body);
  if (!amountReject.ok) {
    return jsonResponse(400, {
      error: amountReject.error,
      code: amountReject.code,
    });
  }

  const packageIdResult = requireNonEmpty(body.packageId, 'packageId');
  if (!packageIdResult.ok) {
    return jsonResponse(400, {
      error: packageIdResult.error,
      code: packageIdResult.code,
    });
  }

  const enumResult = requireEnum(
    packageIdResult.value,
    ORDER_PACKAGE_IDS,
    'packageId',
  );
  if (!enumResult.ok) {
    return jsonResponse(400, {
      error: 'Unknown package.',
      code: 'VALIDATION_ERROR',
    });
  }

  const packageId = enumResult.value;
  const pkg = resolveOrderPackage(packageId);
  if (!pkg || !isOrderPackageId(packageId)) {
    return jsonResponse(400, {
      error: 'Unknown package.',
      code: 'VALIDATION_ERROR',
    });
  }

  const amountPaise = amountPaiseForPackage(pkg);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    safeLog('error', 'create-order-invalid-server-price', { packageId });
    return jsonResponse(500, {
      error: 'Could not resolve package price.',
      code: 'ORDER_FAILED',
    });
  }

  const contentHash = trimString(body.contentHash);

  try {
    const order = await createRazorpayOrder({
      amountPaise,
      packageId: pkg.id,
      contentHash: contentHash || 'unbound',
      receipt: `nakalai_${pkg.id}_${Date.now()}`,
    });

    const publicKey = getRazorpayKeyId();
    if (!publicKey) {
      return jsonResponse(503, {
        error: 'Payment gateway is not configured.',
        code: 'PAYMENT_NOT_CONFIGURED',
      });
    }

    safeLog('info', 'create-order-success', {
      packageId: pkg.id,
      orderId: order.id,
      amountPaise,
    });

    const response: CreateOrderSuccess = {
      orderId: order.id,
      currency: 'INR',
      amount: amountPaise,
      publicKey,
      packageId: pkg.id,
    };

    return jsonResponse(200, response);
  } catch (err) {
    safeLog('error', 'create-order-failed', {
      packageId: pkg.id,
      message: err instanceof Error ? err.message : 'unknown',
    });
    return jsonResponse(502, {
      error: 'Could not create payment order. Please try again.',
      code: 'ORDER_FAILED',
    });
  }
}
