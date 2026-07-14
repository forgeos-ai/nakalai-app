/**
 * Per-isolate payment idempotency (replay protection).
 * Production fleets should persist processed payment IDs in Supabase via service role.
 */

const processedPayments = new Map<string, number>();
const TTL_MS = 24 * 60 * 60 * 1000;

function purgeExpired(now: number): void {
  for (const [id, exp] of processedPayments) {
    if (exp <= now) processedPayments.delete(id);
  }
}

/** Returns false when the payment id was already processed (replay). */
export function markPaymentProcessed(paymentId: string): boolean {
  const now = Date.now();
  purgeExpired(now);
  if (processedPayments.has(paymentId)) return false;
  processedPayments.set(paymentId, now + TTL_MS);
  return true;
}
