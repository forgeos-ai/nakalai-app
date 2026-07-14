import { jsonResponse } from '../../../lib/security/apiResponse';
import {
  issueDownloadGrant,
  parsePaymentVerificationGrant,
} from '../../../lib/security/downloadGrant';
import {
  FREE_PAGE_CAP,
  maxPagesForPackage,
  resolvePackage,
} from '../../../lib/security/pricingServer';

export const runtime = 'nodejs';

type AuthorizeBody = {
  mode?: 'free' | 'paid';
  contentHash?: string;
  layoutPageCount?: number;
  packageId?: string;
  paymentVerificationToken?: string;
};

export async function POST(request: Request): Promise<Response> {
  let body: AuthorizeBody;
  try {
    body = (await request.json()) as AuthorizeBody;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  }

  const contentHash = body.contentHash?.trim();
  const layoutPageCount = Number(body.layoutPageCount);
  const mode = body.mode;

  if (!contentHash || contentHash.length < 8) {
    return jsonResponse(400, {
      error: 'contentHash is required.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (!Number.isFinite(layoutPageCount) || layoutPageCount < 1) {
    return jsonResponse(400, {
      error: 'layoutPageCount must be a positive number.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (mode === 'free') {
    if (layoutPageCount > FREE_PAGE_CAP) {
      return jsonResponse(403, {
        error: `Free downloads are limited to ${FREE_PAGE_CAP} pages.`,
        code: 'FREE_CAP_EXCEEDED',
      });
    }

    const grantToken = await issueDownloadGrant({
      mode: 'free',
      maxPages: FREE_PAGE_CAP,
      contentHash,
      packageId: 'free',
    });

    return jsonResponse(200, {
      ok: true,
      mode: 'free',
      maxPages: FREE_PAGE_CAP,
      skipWatermark: false,
      grantToken,
      expiresInSeconds: 300,
    });
  }

  if (mode !== 'paid') {
    return jsonResponse(400, { error: 'mode must be free or paid.', code: 'VALIDATION_ERROR' });
  }

  const verificationToken = body.paymentVerificationToken?.trim();
  if (!verificationToken) {
    return jsonResponse(402, {
      error: 'Paid download requires a verified payment token.',
      code: 'PAYMENT_REQUIRED',
    });
  }

  const paymentGrant = await parsePaymentVerificationGrant(verificationToken);
  if (!paymentGrant) {
    return jsonResponse(403, {
      error: 'Payment verification token is invalid or expired.',
      code: 'INVALID_PAYMENT_TOKEN',
    });
  }

  if (paymentGrant.contentHash !== contentHash) {
    return jsonResponse(403, {
      error: 'Payment token does not match current assignment content.',
      code: 'CONTENT_MISMATCH',
    });
  }

  const packageId = body.packageId?.trim() || paymentGrant.packageId;
  if (packageId !== paymentGrant.packageId) {
    return jsonResponse(403, {
      error: 'Package mismatch for verified payment.',
      code: 'PACKAGE_MISMATCH',
    });
  }

  const pkg = resolvePackage(packageId);
  const maxPages = Math.min(maxPagesForPackage(packageId), layoutPageCount);

  const grantToken = await issueDownloadGrant({
    mode: 'paid',
    maxPages,
    contentHash,
    packageId,
    paymentId: paymentGrant.paymentId,
  });

  return jsonResponse(200, {
    ok: true,
    mode: 'paid',
    maxPages,
    skipWatermark: true,
    grantToken,
    expiresInSeconds: 300,
    packageId: pkg.id,
  });
}
