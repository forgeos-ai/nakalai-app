/**
 * Free analytics / webmaster integration points.
 * Fill env vars in Vercel (or .env) — never commit real tokens.
 *
 * Vite exposes only VITE_* vars to the client.
 */
const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
const GSC_META = import.meta.env.VITE_GSC_VERIFICATION as string | undefined;
const BING_META = import.meta.env.VITE_BING_VERIFICATION as string | undefined;

function upsertMeta(name: string, content: string) {
  if (typeof document === 'undefined' || !content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Inject GSC / Bing verification meta tags when configured. */
export function injectWebmasterVerification() {
  if (GSC_META) upsertMeta('google-site-verification', GSC_META);
  if (BING_META) upsertMeta('msvalidate.01', BING_META);
}

/** Load GA4 gtag.js once when VITE_GA4_MEASUREMENT_ID is set. */
export function initGoogleAnalytics() {
  if (typeof window === 'undefined' || !GA4_ID) return;
  if (document.getElementById('nakalai-ga4')) return;

  const script = document.createElement('script');
  script.async = true;
  script.id = 'nakalai-ga4';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
  document.head.appendChild(script);

  const w = window as Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag(...args: unknown[]) {
    w.dataLayer!.push(args);
  };
  w.gtag('js', new Date());
  w.gtag('config', GA4_ID);
}

export function initAnalyticsIntegrations() {
  injectWebmasterVerification();
  initGoogleAnalytics();
}
