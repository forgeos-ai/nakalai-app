/**
 * Server-side pricing lookup — never trust client-supplied amounts.
 */

import { getPricingPackageById, type PricingPackage } from '../../src/billing';

export const FREE_PAGE_CAP = 3 as const;

export function resolvePackage(packageId: string | null | undefined): PricingPackage {
  return getPricingPackageById(packageId);
}

export function amountPaiseForPackage(packageId: string): number {
  const pkg = resolvePackage(packageId);
  return Math.round(pkg.amountInr * 100);
}

export function maxPagesForPackage(packageId: string): number {
  return resolvePackage(packageId).pages;
}
