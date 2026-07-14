/**
 * Zero-cost client boundaries — never ship rendering / export work to a server.
 */

/** Free-tier structural page cap (layout matrix length). */
export const FREE_PAGE_CAP = 3 as const;

export const FREE_TIER_PAGE_ALERT =
  'Free tier downloads are capped at 3 pages maximum. Upgrade to our value tiers to download your full assignment instantly!';

export const AD_BLOCKER_FREE_DOWNLOAD_WARNING =
  'Ad blocker detected. Free downloads are disabled while an ad blocker is active. Pause your ad blocker to use the free ≤3-page download, or upgrade to a paid page bundle.';

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

export function isWithinFreePageCap(calculatedPages: number): boolean {
  return calculatedPages <= FREE_PAGE_CAP;
}
