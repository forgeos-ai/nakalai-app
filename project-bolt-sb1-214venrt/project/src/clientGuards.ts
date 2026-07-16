/**
 * Zero-cost client boundaries — never ship rendering / export work to a server.
 */

/**
 * No free download tier (founder rule).
 * Kept at 0 so any residual `mode: 'free'` path cannot grant pages.
 */
export const FREE_PAGE_CAP = 0 as const;

export const FREE_TIER_PAGE_ALERT =
  'Downloads require a page pack. Standard starts at ₹19 for up to 5 pages; Match My Style starts at ₹49 for up to 5 pages.';

export const AD_BLOCKER_FREE_DOWNLOAD_WARNING =
  'Ad blocker detected. Free downloads are not available. Use a paid page pack to download your assignment.';

const ADSENSE_PROBE =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

/**
 * Best-effort ad-blocker probe (client-only).
 * Returns true when the probe fails / is blocked.
 */
export async function detectAdBlocker(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    await fetch(ADSENSE_PROBE, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    // Opaque 200-class response — probe reached the network
    return false;
  } catch {
    // Abort, network fail, or extension block
    return true;
  }
}

/** Always false — there is no free page allowance. */
export function isWithinFreePageCap(_calculatedPages: number): boolean {
  return false;
}
