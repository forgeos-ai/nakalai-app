import {
  getCheckoutQuote,
  type BillingTier,
  type CheckoutQuote,
} from './billing';
import {
  SOURCE_APP,
  PAYMENT_STATUS_KEY,
  PAYMENT_RECEIPT_KEY,
} from './sourceApp';
import { allowMockPayments } from './security/runtimeMode';
import {
  clearServerEntitlement,
  getServerEntitlement,
  isServerEntitlementValidFor,
} from './security/serverEntitlement';

export { PAYMENT_STATUS_KEY, PAYMENT_RECEIPT_KEY };

export type PaymentReceipt = {
  payment_status: 'unpaid' | 'paid';
  tier_type: BillingTier;
  amount_inr: number;
  paid_at: string | null;
  source_app: string;
};

/**
 * Paid status for UI gating.
 * Production: requires short-lived server-verified entitlement (never localStorage alone).
 * Development: localStorage mock flag is permitted.
 */
export function isMockPaymentPaid(): boolean {
  if (allowMockPayments()) {
    try {
      return localStorage.getItem(PAYMENT_STATUS_KEY) === 'true';
    } catch {
      return false;
    }
  }
  const ent = getServerEntitlement();
  return Boolean(ent?.paid && Date.now() < ent.expiresAt);
}

export function getPaymentReceipt(): PaymentReceipt | null {
  try {
    const raw = localStorage.getItem(PAYMENT_RECEIPT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PaymentReceipt;
  } catch {
    return null;
  }
}

function writePaymentReceipt(receipt: PaymentReceipt): void {
  if (!allowMockPayments()) return;
  try {
    localStorage.setItem(PAYMENT_RECEIPT_KEY, JSON.stringify(receipt));
    if (receipt.payment_status === 'paid') {
      localStorage.setItem(PAYMENT_STATUS_KEY, 'true');
    } else {
      localStorage.removeItem(PAYMENT_STATUS_KEY);
    }
  } catch {
    // ignore quota / private-mode failures
  }
}

/**
 * Initialize / complete a mock UPI payment with dynamic tier pricing.
 * Dev-only — production unlocks require Razorpay verification.
 */
export function completeMockPayment(quote: CheckoutQuote): PaymentReceipt {
  const receipt: PaymentReceipt = {
    payment_status: 'paid',
    tier_type: quote.tier_type,
    amount_inr: quote.amountInr,
    paid_at: new Date().toISOString(),
    source_app: SOURCE_APP,
  };
  writePaymentReceipt(receipt);
  return receipt;
}

export function clearMockPayment(
  hasMatchedStyle: boolean | string,
): PaymentReceipt {
  const quote = getCheckoutQuote(hasMatchedStyle);
  const receipt: PaymentReceipt = {
    payment_status: 'unpaid',
    tier_type: quote.tier_type,
    amount_inr: quote.amountInr,
    paid_at: null,
    source_app: SOURCE_APP,
  };
  writePaymentReceipt(receipt);
  clearServerEntitlement();
  return receipt;
}

/**
 * Pay-per-download lock: content mutation voids the current paid pass.
 */
export function invalidatePaidSessionForContentChange(
  hasMatchedStyle: boolean,
): PaymentReceipt | null {
  const wasPaid = isMockPaymentPaid();
  if (!wasPaid) return null;

  try {
    if (allowMockPayments()) {
      localStorage.removeItem(PAYMENT_STATUS_KEY);
      localStorage.removeItem(PAYMENT_RECEIPT_KEY);
    }
    clearServerEntitlement();
  } catch {
    // ignore
  }

  return clearMockPayment(hasMatchedStyle);
}

/** Toggle paid/unpaid — dev/mock builds only. */
export function toggleMockPayment(hasMatchedStyle: boolean | string): {
  isPaid: boolean;
  receipt: PaymentReceipt;
  quote: CheckoutQuote;
} {
  const quote = getCheckoutQuote(hasMatchedStyle);
  if (!allowMockPayments()) {
    const receipt = clearMockPayment(hasMatchedStyle);
    return { isPaid: isServerEntitlementValidFor('', quote.packageId), receipt, quote };
  }
  if (isMockPaymentPaid()) {
    const receipt = clearMockPayment(hasMatchedStyle);
    return { isPaid: false, receipt, quote };
  }
  const receipt = completeMockPayment(quote);
  return { isPaid: true, receipt, quote };
}

/** @deprecated Prefer toggleMockPayment(hasMatchedStyle) */
export function setMockPaymentPaid(paid: boolean): void {
  if (!allowMockPayments()) return;
  if (paid) {
    completeMockPayment(getCheckoutQuote(false));
  } else {
    clearMockPayment(false);
  }
}

/** @deprecated Prefer toggleMockPayment(hasMatchedStyle) */
export function toggleMockPaymentPaid(): boolean {
  const { isPaid } = toggleMockPayment(false);
  return isPaid;
}
