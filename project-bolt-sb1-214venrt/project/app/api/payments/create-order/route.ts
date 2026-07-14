import { jsonResponse } from '../../../../lib/security/apiResponse';
import {
  amountPaiseForPackage,
  resolvePackage,
} from '../../../../lib/security/pricingServer';
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from '../../../../lib/security/razorpay';

export const runtime = 'nodejs';

type CreateOrderBody = {
  packageId?: string;
  contentHash?: string;
};

export async function POST(request: Request): Promise<Response> {
  if (!isRazorpayConfigured()) {
    return jsonResponse(503, {
      error: 'Payment gateway is not configured.',
      code: 'PAYMENT_NOT_CONFIGURED',
    });
  }

  let body: CreateOrderBody;
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  }

  const packageId = body.packageId?.trim();
  const contentHash = body.contentHash?.trim();

  if (!packageId) {
    return jsonResponse(400, { error: 'packageId is required.', code: 'VALIDATION_ERROR' });
  }
  if (!contentHash || contentHash.length < 8) {
    return jsonResponse(400, { error: 'contentHash is required.', code: 'VALIDATION_ERROR' });
  }

  const pkg = resolvePackage(packageId);
  const amountPaise = amountPaiseForPackage(packageId);

  try {
    const order = await createRazorpayOrder({
      amountPaise,
      packageId: pkg.id,
      contentHash,
      receipt: `nakalai_${pkg.id}_${Date.now()}`,
    });

    return jsonResponse(200, {
      ok: true,
      orderId: order.id,
      amountInr: pkg.amountInr,
      amountPaise,
      currency: 'INR',
      packageId: pkg.id,
      pages: pkg.pages,
      keyId: getRazorpayKeyId(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'order-creation-failed';
    return jsonResponse(502, { error: message, code: 'ORDER_FAILED' });
  }
}
