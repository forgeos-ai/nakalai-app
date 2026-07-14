/**
 * Client runtime security mode — mock payments and localStorage trust are dev-only.
 */

export function allowMockPayments(): boolean {
  try {
    if (import.meta.env.DEV) return true;
    const flag = import.meta.env.VITE_ALLOW_MOCK_PAYMENTS;
    return flag === 'true' || flag === '1';
  } catch {
    return false;
  }
}

/** Production builds must use server-verified entitlements for paid exports. */
export function requiresServerPaymentVerification(): boolean {
  return !allowMockPayments();
}
