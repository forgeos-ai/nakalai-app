/** Immutable micro-transaction prices (INR). */
export const PRICE_STANDARD = 19 as const;
export const PRICE_PREMIUM = 49 as const;

export type BillingTier = 'standard' | 'premium';

export type CheckoutQuote = {
  tier_type: BillingTier;
  amountInr: typeof PRICE_STANDARD | typeof PRICE_PREMIUM;
  ctaLabel: string;
  paidLabel: string;
};

/**
 * Dynamic checkout quote from personalization state.
 * Premium (₹49) triggers when Match My Writing Style (`matchedStyles`) is active;
 * otherwise standard clean PDF is ₹19.
 */
export function getCheckoutQuote(hasMatchedStyle: boolean): CheckoutQuote {
  if (hasMatchedStyle) {
    return {
      tier_type: 'premium',
      amountInr: PRICE_PREMIUM,
      ctaLabel: `Pay ₹${PRICE_PREMIUM} to Download Custom Writing PDF`,
      paidLabel: `Paid ₹${PRICE_PREMIUM} · Custom Writing PDF unlocked`,
    };
  }

  return {
    tier_type: 'standard',
    amountInr: PRICE_STANDARD,
    ctaLabel: `Pay ₹${PRICE_STANDARD} to Download Clean PDF`,
    paidLabel: `Paid ₹${PRICE_STANDARD} · Clean PDF unlocked`,
  };
}
