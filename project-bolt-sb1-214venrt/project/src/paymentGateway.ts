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

export { PAYMENT_STATUS_KEY, PAYMENT_RECEIPT_KEY };

export type PaymentReceipt = {
  payment_status: 'unpaid' | 'paid';
  tier_type: BillingTier;
  amount_inr: number;
  paid_at: string | null;
  source_app: string;
};

/**
 * Mock UPI payment receipt for local monetization testing.
 * When true, preview watermark is removed and clean PDF export is unlocked.
 */
export function isMockPaymentPaid(): boolean {
  try {
    return localStorage.getItem(PAYMENT_STATUS_KEY) === 'true';
  } catch {
    return false;
  }
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
 * Persists tier_type + amount for analytics (localStorage + profile sync).
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

export function clearMockPayment(hasMatchedStyle: boolean): PaymentReceipt {
  const quote = getCheckoutQuote(hasMatchedStyle);
  const receipt: PaymentReceipt = {
    payment_status: 'unpaid',
    tier_type: quote.tier_type,
    amount_inr: quote.amountInr,
    paid_at: null,
    source_app: SOURCE_APP,
  };
  writePaymentReceipt(receipt);
  return receipt;
}

/**
 * Pay-per-download lock: content mutation (textarea edit / new PDF) voids
 * the current paid pass — clears receipt tokens and returns unpaid.
 * Idempotent when already unpaid.
 */
export function invalidatePaidSessionForContentChange(
  hasMatchedStyle: boolean,
): PaymentReceipt | null {
  if (!isMockPaymentPaid()) return null;

  try {
    localStorage.removeItem(PAYMENT_STATUS_KEY);
    localStorage.removeItem(PAYMENT_RECEIPT_KEY);
  } catch {
    // ignore
  }

  return clearMockPayment(hasMatchedStyle);
}

/** Toggle paid/unpaid using the live checkout quote (standard vs premium). */
export function toggleMockPayment(hasMatchedStyle: boolean): {
  isPaid: boolean;
  receipt: PaymentReceipt;
  quote: CheckoutQuote;
} {
  const quote = getCheckoutQuote(hasMatchedStyle);
  if (isMockPaymentPaid()) {
    const receipt = clearMockPayment(hasMatchedStyle);
    return { isPaid: false, receipt, quote };
  }
  const receipt = completeMockPayment(quote);
  return { isPaid: true, receipt, quote };
}

/** @deprecated Prefer toggleMockPayment(hasMatchedStyle) */
export function setMockPaymentPaid(paid: boolean): void {
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
