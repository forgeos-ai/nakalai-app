import { signPayload, verifySignedPayload } from './hmac';
import { getDownloadTokenSecret } from './env';

export type DownloadGrant = {
  mode: 'free' | 'paid';
  maxPages: number;
  contentHash: string;
  packageId: string;
  paymentId?: string;
  exp: number;
  nonce: string;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function randomNonce(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `n_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export async function issueDownloadGrant(
  partial: Omit<DownloadGrant, 'exp' | 'nonce'>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<string> {
  const grant: DownloadGrant = {
    ...partial,
    exp: Date.now() + ttlMs,
    nonce: randomNonce(),
  };
  const secret = getDownloadTokenSecret();
  return signPayload(JSON.stringify(grant), secret);
}

export async function parseDownloadGrant(token: string): Promise<DownloadGrant | null> {
  const secret = getDownloadTokenSecret();
  if (!secret) return null;
  const raw = await verifySignedPayload(token, secret);
  if (!raw) return null;

  try {
    const grant = JSON.parse(raw) as DownloadGrant;
    if (!grant || typeof grant.exp !== 'number' || Date.now() > grant.exp) {
      return null;
    }
    if (grant.mode !== 'free' && grant.mode !== 'paid') return null;
    if (!grant.contentHash || typeof grant.maxPages !== 'number') return null;
    return grant;
  } catch {
    return null;
  }
}

export type PaymentVerificationGrant = {
  kind: 'payment_verification';
  packageId: string;
  paymentId: string;
  orderId: string;
  amountPaise: number;
  contentHash: string;
  exp: number;
  nonce: string;
};

export async function issuePaymentVerificationGrant(
  partial: Omit<PaymentVerificationGrant, 'exp' | 'nonce' | 'kind'>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<string> {
  const grant: PaymentVerificationGrant = {
    kind: 'payment_verification',
    ...partial,
    exp: Date.now() + ttlMs,
    nonce: randomNonce(),
  };
  const secret = getDownloadTokenSecret();
  return signPayload(JSON.stringify(grant), secret);
}

export async function parsePaymentVerificationGrant(
  token: string,
): Promise<PaymentVerificationGrant | null> {
  const secret = getDownloadTokenSecret();
  if (!secret) return null;
  const raw = await verifySignedPayload(token, secret);
  if (!raw) return null;

  try {
    const grant = JSON.parse(raw) as PaymentVerificationGrant;
    if (grant?.kind !== 'payment_verification') return null;
    if (typeof grant.exp !== 'number' || Date.now() > grant.exp) return null;
    if (!grant.paymentId || !grant.packageId || !grant.contentHash) return null;
    return grant;
  } catch {
    return null;
  }
}
