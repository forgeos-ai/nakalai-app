/**
 * Vercel Serverless — POST /api/downloads/authorize
 * Mirrors the legacy Next route for the Vite deployment.
 */

import {
  issueDownloadGrant,
  parsePaymentVerificationGrant,
} from '../../lib/security/downloadGrant.ts';
import {
  maxPagesForPackage,
  resolvePackage,
} from '../../lib/security/pricingServer.ts';

export const runtime = 'nodejs';

type AuthorizeBody = {
  mode?: 'paid';
  contentHash?: string;
  layoutPageCount?: number;
  packageId?: string;
  paymentVerificationToken?: string;
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

export async function POST(request: Request): Promise<Response> {
  let body: AuthorizeBody;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return json(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
    }
    body = parsed as AuthorizeBody;
  } catch {
    return json(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  }

  const contentHash = body.contentHash?.trim();
  const layoutPageCount = Number(body.layoutPageCount);

  if (!contentHash || contentHash.length < 8) {
    return json(400, {
      error: 'contentHash is required.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (!Number.isFinite(layoutPageCount) || layoutPageCount < 1) {
    return json(400, {
      error: 'layoutPageCount must be a positive number.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (body.mode !== 'paid') {
    return json(400, {
      error: 'mode must be paid.',
      code: 'VALIDATION_ERROR',
    });
  }

  const verificationToken = body.paymentVerificationToken?.trim();
  if (!verificationToken) {
    return json(402, {
      error: 'Paid download requires a verified payment token.',
      code: 'PAYMENT_REQUIRED',
    });
  }

  const paymentGrant = await parsePaymentVerificationGrant(verificationToken);
  if (!paymentGrant) {
    return json(403, {
      error: 'Payment verification token is invalid or expired.',
      code: 'INVALID_PAYMENT_TOKEN',
    });
  }

  if (paymentGrant.contentHash !== contentHash) {
    return json(403, {
      error: 'Payment token does not match current assignment content.',
      code: 'CONTENT_MISMATCH',
    });
  }

  const packageId = body.packageId?.trim() || paymentGrant.packageId;
  if (packageId !== paymentGrant.packageId) {
    return json(403, {
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

  return json(200, {
    ok: true,
    mode: 'paid',
    maxPages,
    skipWatermark: true,
    grantToken,
    expiresInSeconds: 300,
    packageId: pkg.id,
  });
}
