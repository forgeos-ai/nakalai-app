import { FREE_PAGE_CAP } from '../clientGuards';
import { allowMockPayments } from './runtimeMode';
import {
  getServerEntitlement,
  type ServerEntitlement,
} from './serverEntitlement';

export type ExportAuthorization = {
  maxPages: number;
  skipWatermark: boolean;
  grantToken?: string;
};

type AuthorizeRequest = {
  mode: 'free' | 'paid';
  contentHash: string;
  layoutPageCount: number;
  packageId?: string;
  paymentVerificationToken?: string;
};

async function postAuthorize(body: AuthorizeRequest): Promise<ExportAuthorization> {
  const response = await fetch('/api/downloads/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    maxPages?: number;
    skipWatermark?: boolean;
    grantToken?: string;
    error?: string;
    code?: string;
  };

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? `Download authorization failed (${response.status})`);
  }

  return {
    maxPages: data.maxPages ?? FREE_PAGE_CAP,
    skipWatermark: Boolean(data.skipWatermark),
    grantToken: data.grantToken,
  };
}

function devFallbackAuthorization(
  mode: 'free' | 'paid',
  layoutPageCount: number,
): ExportAuthorization {
  if (mode === 'free') {
    return {
      maxPages: Math.min(FREE_PAGE_CAP, layoutPageCount),
      skipWatermark: false,
    };
  }
  return {
    maxPages: layoutPageCount,
    skipWatermark: true,
  };
}

/**
 * Request server authorization before PDF export.
 * In dev/mock mode, falls back to local caps when API routes are unavailable.
 */
export async function authorizeExport(opts: {
  mode: 'free' | 'paid';
  contentHash: string;
  layoutPageCount: number;
  packageId?: string;
}): Promise<ExportAuthorization> {
  const entitlement: ServerEntitlement | null = getServerEntitlement();
  const paymentVerificationToken =
    opts.mode === 'paid' ? entitlement?.paymentVerificationToken : undefined;

  if (opts.mode === 'paid' && allowMockPayments()) {
    return devFallbackAuthorization('paid', opts.layoutPageCount);
  }

  try {
    return await postAuthorize({
      mode: opts.mode,
      contentHash: opts.contentHash,
      layoutPageCount: opts.layoutPageCount,
      packageId: opts.packageId,
      paymentVerificationToken,
    });
  } catch (err) {
    if (allowMockPayments()) {
      if (import.meta.env.DEV) {
        console.warn('[NakalAI] Download authorize API unavailable — using dev fallback.', err);
      }
      return devFallbackAuthorization(opts.mode, opts.layoutPageCount);
    }
    throw err;
  }
}
