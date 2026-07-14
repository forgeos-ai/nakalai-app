import {
  bulkValueProposition,
  pricingTiers,
  formatPerPage,
  getBestBulkTier,
} from '../billing';

const BULK_SNIPPET = bulkValueProposition();
const BEST_BULK = getBestBulkTier();
const PRICING_SNIPPET = `Page bundles from ₹${pricingTiers[0]!.amountInr}: 10 or 75 pages on Standard or Premium Match. ${BULK_SNIPPET}`;

/** Injected into keyword landing descriptions/sections for programmatic SEO. */
export function seoPricingBlurb(): string {
  return PRICING_SNIPPET;
}

export function seoBulkValueLine(): string {
  return BULK_SNIPPET;
}

export function seoBestBulkDetail(): string {
  return `${BEST_BULK.name} is ${formatPerPage(BEST_BULK)} per page — ideal for long notebooks and multi-chapter records.`;
}
