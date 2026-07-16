/** Package matrix — flat rates for checkout dropdown. */

export type BillingTier = 'standard' | 'premium';

export type PackageEngine = 'standard' | 'premium';

/** Founder entry allowance: Standard ₹19 / Custom ₹49 cover up to this many pages. */
export const ENTRY_PACKAGE_PAGES = 5 as const;

export const BULK_PACKAGE_PAGES = 75 as const;

export type PricingPackage = {
  id: string;
  label: string;
  pages: typeof ENTRY_PACKAGE_PAGES | typeof BULK_PACKAGE_PAGES;
  engine: PackageEngine;
  amountInr: number;
};

/** Canonical selectable packages (dropdown options). */
export const PRICING_PACKAGES: PricingPackage[] = [
  {
    id: 'std-10',
    label: 'Standard 5-Page Pack — ₹19 (₹3.80/page)',
    pages: ENTRY_PACKAGE_PAGES,
    engine: 'standard',
    amountInr: 19,
  },
  {
    id: 'match-10',
    label: 'Premium Match 5-Page Pack — ₹49 (₹9.80/page)',
    pages: ENTRY_PACKAGE_PAGES,
    engine: 'premium',
    amountInr: 49,
  },
  {
    id: 'std-75',
    label: 'Standard 75-Page Value Pack — ₹79 (₹1.05/page)',
    pages: BULK_PACKAGE_PAGES,
    engine: 'standard',
    amountInr: 79,
  },
  {
    id: 'match-75',
    label: 'Premium Match 75-Page Value Pack — ₹109 (₹1.45/page)',
    pages: BULK_PACKAGE_PAGES,
    engine: 'premium',
    amountInr: 109,
  },
];

export const DEFAULT_PACKAGE_ID = 'std-10';

export type CheckoutQuote = {
  packageId: string;
  tier_type: BillingTier;
  pages: number;
  amountInr: number;
  ctaLabel: string;
  paidLabel: string;
};

/** @deprecated Prefer package amounts */
export const PRICE_STANDARD = 19 as const;
/** @deprecated Prefer package amounts */
export const PRICE_PREMIUM = 49 as const;

export function getPricingPackageById(
  id: string | null | undefined,
): PricingPackage {
  return (
    PRICING_PACKAGES.find((p) => p.id === id) ?? PRICING_PACKAGES[0]!
  );
}

export function quoteFromPackage(pkg: PricingPackage): CheckoutQuote {
  const engineLabel =
    pkg.engine === 'premium' ? 'Match My Style' : 'Standard Fonts';
  return {
    packageId: pkg.id,
    tier_type: pkg.engine,
    pages: pkg.pages,
    amountInr: pkg.amountInr,
    ctaLabel: `Pay ₹${pkg.amountInr} · ${pkg.pages}-page ${engineLabel}`,
    paidLabel: `Paid ₹${pkg.amountInr} · ${pkg.pages}-page ${engineLabel} unlocked`,
  };
}

/**
 * Resolve checkout quote from an explicit package selection.
 * Falls back to Match My Style heuristic when no package id is given.
 */
export function getCheckoutQuote(
  hasMatchedStyleOrPackageId: boolean | string = false,
): CheckoutQuote {
  if (typeof hasMatchedStyleOrPackageId === 'string') {
    return quoteFromPackage(getPricingPackageById(hasMatchedStyleOrPackageId));
  }
  const pkg = hasMatchedStyleOrPackageId
    ? getPricingPackageById('match-10')
    : getPricingPackageById('std-10');
  return quoteFromPackage(pkg);
}

/** Prefer bulk package when canvas exceeds the entry pack allowance. */
export function resolveDefaultPackageId(
  hasMatchedStyle: boolean,
  layoutPageCount: number,
): string {
  const needsBulk = layoutPageCount > ENTRY_PACKAGE_PAGES;
  if (hasMatchedStyle && needsBulk) return 'match-75';
  if (hasMatchedStyle) return 'match-10';
  if (needsBulk) return 'std-75';
  return 'std-10';
}

/* —— Compatibility aliases for legacy matrix / drawer components —— */

/** @deprecated Use PricingPackage */
export type PricingTier = PricingPackage & {
  name: string;
  badge?: string | null;
  description: string;
};

/** Payload forwarded from the Pay CTA into the checkout execution handler. */
export type CheckoutActivationPayload = {
  id: string;
  priceINR: number;
  pageCount: number;
};

export function toCheckoutActivationPayload(
  tier: PricingTier,
  canvasPageCount: number,
): CheckoutActivationPayload {
  return {
    id: tier.id,
    priceINR: tier.amountInr,
    pageCount: Math.max(1, canvasPageCount),
  };
}

/** @deprecated Use PRICING_PACKAGES */
export const pricingTiers: PricingTier[] = PRICING_PACKAGES.map((p) => ({
  ...p,
  name: p.label,
  badge:
    p.pages === BULK_PACKAGE_PAGES
      ? 'Best Value'
      : p.engine === 'premium'
        ? 'Popular'
        : null,
  description:
    p.engine === 'premium'
      ? `Match My Style · up to ${p.pages} pages`
      : `Standard fonts · up to ${p.pages} pages`,
}));

export function formatPerPage(tier: PricingPackage): string {
  return `₹${(tier.amountInr / tier.pages).toFixed(2)}`;
}

export function isTierSufficient(
  tier: PricingPackage,
  layoutPageCount: number,
): boolean {
  return tier.pages >= Math.max(1, layoutPageCount);
}

export function shouldHighlightBulkBundle(layoutPageCount: number): boolean {
  return layoutPageCount > ENTRY_PACKAGE_PAGES;
}

export function bulkValueProposition(): string {
  const bulk = getPricingPackageById('match-75');
  return `Write massive records from ${formatPerPage(bulk)}/page`;
}

export function getBestBulkTier(): PricingTier {
  return pricingTiers.find((t) => t.id === 'match-75') ?? pricingTiers[3]!;
}

export function getPricingTierById(id: string): PricingTier | undefined {
  return pricingTiers.find((t) => t.id === id);
}

export function resolveDefaultTier(
  hasMatchedStyle: boolean,
  layoutPageCount: number,
): PricingTier {
  const id = resolveDefaultPackageId(hasMatchedStyle, layoutPageCount);
  return getPricingTierById(id) ?? pricingTiers[0]!;
}

export function quoteFromTier(tier: PricingTier): CheckoutQuote {
  return quoteFromPackage(tier);
}
