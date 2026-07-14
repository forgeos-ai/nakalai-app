/**
 * Mirrors src/billing.ts pricingTiers for static SEO HTML generation.
 * Keep amounts in sync with the app checkout matrix.
 */

export const pricingTiers = [
  {
    id: 'standard-10',
    engine: 'standard',
    pages: 10,
    amountInr: 29,
    name: 'Standard · 10 pages',
    description:
      'Platform handwriting fonts for short assignments (up to 10 layout pages).',
  },
  {
    id: 'standard-75',
    engine: 'standard',
    pages: 75,
    amountInr: 79,
    name: 'Standard · 75 pages',
    description: 'Bulk notebook records with platform fonts — lowest per-page rate.',
    badge: 'Best Value',
  },
  {
    id: 'premium-10',
    engine: 'premium',
    pages: 10,
    amountInr: 49,
    name: 'Premium Match · 10 pages',
    description:
      'Match My Style engine for short custom-writing downloads (up to 10 pages).',
  },
  {
    id: 'premium-75',
    engine: 'premium',
    pages: 75,
    amountInr: 149,
    name: 'Premium Match · 75 pages',
    description:
      'Match My Style for long assignments, labs, and multi-chapter records.',
    badge: 'Popular',
  },
];

export function perPageInr(tier) {
  return Math.round((tier.amountInr / tier.pages) * 100) / 100;
}

export function formatPerPage(tier) {
  return `₹${perPageInr(tier).toFixed(2)}`;
}

export function getBestBulkTier() {
  return [...pricingTiers]
    .filter((t) => t.pages === 75)
    .sort((a, b) => perPageInr(a) - perPageInr(b))[0];
}

export function bulkValueProposition() {
  const best = getBestBulkTier();
  return `Write massive records starting at just ${formatPerPage(best)} per page!`;
}

export function pricingTierHtmlList() {
  return pricingTiers
    .map((t) => {
      const badge = t.badge ? ` <em>(${t.badge})</em>` : '';
      return `<li><strong>₹${t.amountInr} — ${t.name}</strong>${badge} — ${t.description} (${formatPerPage(t)}/page)</li>`;
    })
    .join('\n        ');
}
