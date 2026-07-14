import { jsonResponse } from '../../../../lib/security/apiResponse';
import { issuePaymentVerificationGrant } from '../../../../lib/security/downloadGrant';
import { markPaymentProcessed } from '../../../../lib/security/idempotency';
import {
  amountPaiseForPackage,
  maxPagesForPackage,
  resolvePackage,
} from '../../../../lib/security/pricingServer';
import {
  fetchRazorpayOrder,
  isRazorpayConfigured,
  verifyRazorpayPaymentSignature,
} from '../../../../lib/security/razorpay';
import { recordVerifiedPayment } from '../../../../lib/security/supabaseAdmin';

export const runtime = 'nodejs';

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  packageId?: string;
  contentHash?: string;
  userId?: string;
  email?: string;
  mobileNumber?: string;
};

export async function POST(request: Request): Promise<Response> {
  if (!isRazorpayConfigured()) {
    return jsonResponse(503, {
      error: 'Payment gateway is not configured.',
      code: 'PAYMENT_NOT_CONFIGURED',
    });
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  }

  const orderId = body.razorpay_order_id?.trim();
  const paymentId = body.razorpay_payment_id?.trim();
  const signature = body.razorpay_signature?.trim();
  const packageId = body.packageId?.trim();
  const contentHash = body.contentHash?.trim();

  if (!orderId || !paymentId || !signature) {
    return jsonResponse(400, {
      error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      code: 'VALIDATION_ERROR',
    });
  }
  if (!packageId || !contentHash || contentHash.length < 8) {
    return jsonResponse(400, {
      error: 'packageId and contentHash are required.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature)) {
    return jsonResponse(403, {
      error: 'Razorpay signature verification failed.',
      code: 'SIGNATURE_INVALID',
    });
  }

  if (!markPaymentProcessed(paymentId)) {
    return jsonResponse(409, {
      error: 'Payment has already been processed.',
      code: 'PAYMENT_REPLAY',
    });
  }

  const pkg = resolvePackage(packageId);
  const expectedPaise = amountPaiseForPackage(packageId);
  const order = await fetchRazorpayOrder(orderId);

  if (!order) {
    return jsonResponse(502, {
      error: 'Could not fetch Razorpay order for amount validation.',
      code: 'ORDER_LOOKUP_FAILED',
    });
  }

  if (order.amount !== expectedPaise) {
    return jsonResponse(403, {
      error: 'Paid amount does not match server-side package price.',
      code: 'AMOUNT_MISMATCH',
    });
  }

  const orderPackageId = order.notes?.package_id;
  const orderContentHash = order.notes?.content_hash;
  if (orderPackageId && orderPackageId !== packageId) {
    return jsonResponse(403, {
      error: 'Order package does not match checkout selection.',
      code: 'PACKAGE_MISMATCH',
    });
  }
  if (orderContentHash && orderContentHash !== contentHash) {
    return jsonResponse(403, {
      error: 'Order content hash does not match current assignment.',
      code: 'CONTENT_MISMATCH',
    });
  }

  const paymentVerificationToken = await issuePaymentVerificationGrant({
    packageId: pkg.id,
    paymentId,
    orderId,
    amountPaise: expectedPaise,
    contentHash,
  });

  await recordVerifiedPayment({
    userId: body.userId?.trim().toLowerCase(),
    paymentId,
    orderId,
    packageId: pkg.id,
    amountInr: pkg.amountInr,
    email: body.email?.trim().toLowerCase(),
    mobileNumber: body.mobileNumber?.trim(),
  });

  return jsonResponse(200, {
    ok: true,
    paymentVerificationToken,
    packageId: pkg.id,
    maxPages: maxPagesForPackage(pkg.id),
    amountInr: pkg.amountInr,
    paymentId,
    orderId,
    expiresInSeconds: 300,
  });
}
