/**
 * Canonical server-side pricing — single source of truth for payment order creation.
 * NEVER import this module from client bundles (`src/`).
 * @see docs/security/payment-security.md
 */

export const CANONICAL_PACKAGE_IDS = ['P3', 'P20', 'P75', 'P200'] as const;

export type CanonicalPackageId = (typeof CANONICAL_PACKAGE_IDS)[number];

/**
 * Legacy UI package ids (mirror of `src/billing.ts` — server-only, never import client).
 * Enables checkout without changing pricing UI (Sprint 2B Phase 2).
 */
export const UI_CHECKOUT_PACKAGE_IDS = [
  'std-10',
  'match-10',
  'std-75',
  'match-75',
] as const;

export type UiCheckoutPackageId = (typeof UI_CHECKOUT_PACKAGE_IDS)[number];

export const ORDER_PACKAGE_IDS = [
  ...CANONICAL_PACKAGE_IDS,
  ...UI_CHECKOUT_PACKAGE_IDS,
] as const;

export type OrderPackageId = (typeof ORDER_PACKAGE_IDS)[number];

export type OrderPackage = {
  id: OrderPackageId;
  amountInr: number;
  pages: number;
};

/** @deprecated Use OrderPackage */
export type CanonicalPackage = OrderPackage;

/**
 * Authoritative package table (Sprint 2B Phase 1).
 * Browser displays legacy UI prices; server order creation uses ONLY this table.
 */
export const CANONICAL_PACKAGES: readonly OrderPackage[] = [
  { id: 'P3', amountInr: 19, pages: 3 },
  { id: 'P20', amountInr: 49, pages: 20 },
  { id: 'P75', amountInr: 99, pages: 75 },
  { id: 'P200', amountInr: 199, pages: 200 },
] as const;

/** UI-selectable packages — amounts must match `PRICING_PACKAGES` in billing.ts. */
export const UI_CHECKOUT_PACKAGES: readonly OrderPackage[] = [
  { id: 'std-10', amountInr: 19, pages: 5 },
  { id: 'match-10', amountInr: 49, pages: 5 },
  { id: 'std-75', amountInr: 79, pages: 75 },
  { id: 'match-75', amountInr: 109, pages: 75 },
] as const;

const CANONICAL_BY_ID: Record<CanonicalPackageId, OrderPackage> =
  Object.fromEntries(
    CANONICAL_PACKAGES.map((pkg) => [pkg.id, pkg]),
  ) as Record<CanonicalPackageId, OrderPackage>;

const UI_BY_ID: Record<UiCheckoutPackageId, OrderPackage> =
  Object.fromEntries(
    UI_CHECKOUT_PACKAGES.map((pkg) => [pkg.id, pkg]),
  ) as Record<UiCheckoutPackageId, OrderPackage>;

/** Resolve canonical package or null — never falls back to a default. */
export function resolveCanonicalPackage(
  packageId: string | null | undefined,
): OrderPackage | null {
  if (!packageId) return null;
  const id = packageId.trim() as CanonicalPackageId;
  return CANONICAL_BY_ID[id] ?? null;
}

/**
 * Resolve any order-eligible package (canonical or legacy UI id).
 * Unknown ids return null — server rejects at validation.
 */
export function resolveOrderPackage(
  packageId: string | null | undefined,
): OrderPackage | null {
  if (!packageId) return null;
  const id = packageId.trim();
  return (
    resolveCanonicalPackage(id) ??
    UI_BY_ID[id as UiCheckoutPackageId] ??
    null
  );
}

/** Amount in paise (INR × 100) for Razorpay order creation. */
export function amountPaiseForPackage(pkg: OrderPackage): number {
  return Math.round(pkg.amountInr * 100);
}

/** @deprecated Use amountPaiseForPackage(resolveOrderPackage(id)!) */
export function amountPaiseForCanonicalPackage(
  packageId: CanonicalPackageId,
): number {
  const pkg = CANONICAL_BY_ID[packageId];
  return amountPaiseForPackage(pkg);
}

export function isCanonicalPackageId(
  value: string,
): value is CanonicalPackageId {
  return (CANONICAL_PACKAGE_IDS as readonly string[]).includes(value);
}

export function isOrderPackageId(value: string): value is OrderPackageId {
  return (ORDER_PACKAGE_IDS as readonly string[]).includes(value);
}
