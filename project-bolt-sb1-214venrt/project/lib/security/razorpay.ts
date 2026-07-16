import { createHmac, timingSafeEqual } from 'node:crypto';
import { getRazorpayKeyId, getRazorpayKeySecret, isRazorpayConfigured } from './env.js';

export { isRazorpayConfigured, getRazorpayKeyId };

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
};

/**
 * Verify Razorpay payment signature: HMAC_SHA256(order_id|payment_id).
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#step-3-verify-signature
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = getRazorpayKeySecret();
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

export async function createRazorpayOrder(params: {
  amountPaise: number;
  packageId: string;
  contentHash: string;
  receipt?: string;
}): Promise<RazorpayOrder> {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured on the server.');
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
      receipt: params.receipt ?? `nakalai_${Date.now()}`,
      notes: {
        package_id: params.packageId,
        content_hash: params.contentHash,
        source_app: 'nakalai',
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Razorpay order creation failed (${response.status})${
        detail ? `: ${detail.slice(0, 200)}` : ''
      }`,
    );
  }

  return (await response.json()) as RazorpayOrder;
}

export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder | null> {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret || !orderId) return null;

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!response.ok) return null;
  return (await response.json()) as RazorpayOrder;
}
