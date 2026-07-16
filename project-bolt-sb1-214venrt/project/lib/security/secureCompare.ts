/**
 * Timing-safe string comparison for signatures and tokens.
 * SCAFFOLDING — not wired into production routes yet.
 * Existing Razorpay verify uses node:crypto in lib/security/razorpay.ts.
 */

import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time compare for equal-length hex/base64 strings.
 * Returns false if lengths differ (not timing-safe across lengths — prefer equal-length inputs).
 */
export function secureCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Compare two hex-encoded digests (e.g. HMAC outputs).
 */
export function secureCompareHex(expected: string, actual: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  return secureCompare(norm(expected), norm(actual));
}
