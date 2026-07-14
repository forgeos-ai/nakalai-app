/**
 * Short-lived server-verified payment entitlements (sessionStorage — not forgeable like localStorage flags).
 */

const ENTITLEMENT_KEY = 'nakalai_server_entitlement';

export type ServerEntitlement = {
  paid: boolean;
  paymentVerificationToken: string;
  packageId: string;
  contentHash: string;
  maxPages: number;
  expiresAt: number;
};

export function setServerEntitlement(entitlement: ServerEntitlement): void {
  try {
    sessionStorage.setItem(ENTITLEMENT_KEY, JSON.stringify(entitlement));
  } catch {
    // private mode / quota
  }
}

export function getServerEntitlement(): ServerEntitlement | null {
  try {
    const raw = sessionStorage.getItem(ENTITLEMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ServerEntitlement;
    if (!parsed?.paymentVerificationToken || Date.now() > parsed.expiresAt) {
      clearServerEntitlement();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearServerEntitlement(): void {
  try {
    sessionStorage.removeItem(ENTITLEMENT_KEY);
  } catch {
    // ignore
  }
}

export function isServerEntitlementValidFor(
  contentHash: string,
  packageId?: string,
): boolean {
  const ent = getServerEntitlement();
  if (!ent?.paid) return false;
  if (ent.contentHash !== contentHash) return false;
  if (packageId && ent.packageId !== packageId) return false;
  return true;
}
