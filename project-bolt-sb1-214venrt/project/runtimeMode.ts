export const PAYMENT_MODES = ['MOCK', 'TEST', 'LIVE'] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

/**
 * The only payment-mode resolver. Callers supply the value injected by their
 * runtime (Vite in the browser, process.env in a serverless function).
 */
export function resolvePaymentMode(rawMode: unknown): PaymentMode {
  if (typeof rawMode !== 'string') {
    throw new Error(
      'PAYMENT_MODE is required and must be MOCK, TEST, or LIVE.',
    );
  }

  const normalized = rawMode.trim().toUpperCase();
  if ((PAYMENT_MODES as readonly string[]).includes(normalized)) {
    return normalized as PaymentMode;
  }

  throw new Error(
    `Invalid PAYMENT_MODE "${rawMode}". Expected MOCK, TEST, or LIVE.`,
  );
}

/** Fail closed when a real gateway mode is paired with the wrong key family. */
export function assertRazorpayKeyMatchesMode(
  mode: PaymentMode,
  keyId: string,
): void {
  if (mode === 'MOCK') {
    throw new Error('The payment API is disabled in MOCK mode.');
  }

  const expectedPrefix = mode === 'TEST' ? 'rzp_test_' : 'rzp_live_';
  if (!keyId.startsWith(expectedPrefix)) {
    throw new Error(
      `${mode} mode requires a Razorpay key beginning with ${expectedPrefix}.`,
    );
  }
}
