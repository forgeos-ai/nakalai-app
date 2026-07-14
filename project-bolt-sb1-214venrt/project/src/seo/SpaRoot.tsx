import { lazy, Suspense, useEffect, useMemo } from 'react';
import AnalyticsBoot from './AnalyticsBoot';
import { buildSeoMetadata } from './generateMetadata';
import { applyDocumentMetadata, applyJsonLd } from './pageMetadata';
import {
  RESERVED_STATIC_SLUGS,
  resolveLandingPage,
} from '../../content/seo/landing-pages/registry';
import { buildLandingPageJsonLd } from '../../content/seo/schemas/jsonLd';

const App = lazy(() => import('../App'));
const SeoLandingView = lazy(() => import('./SeoLandingView'));

function pathSlug(): string | null {
  const raw = window.location.pathname.replace(/\/+$/, '') || '/';
  if (raw === '/') return null;
  const first = raw.slice(1).split('/')[0]?.toLowerCase() ?? '';
  return first || null;
}

const homeFallback = (
  <div className="flex h-[100dvh] items-center justify-center bg-slate-900 text-sm text-slate-400">
    Loading NakalAI…
  </div>
);

const landingFallback = (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
    Loading page…
  </div>
);

/**
 * Vite SPA router — preserves home + programmatic SEO landing routes
 * previously served by Next.js app/[slug].
 */
export default function SpaRoot() {
  const slug = useMemo(() => pathSlug(), []);

  const isSeoLanding =
    Boolean(slug) && slug !== null && !RESERVED_STATIC_SLUGS.has(slug);

  useEffect(() => {
    if (!isSeoLanding || !slug) return;
    const config = resolveLandingPage(slug);
    applyDocumentMetadata(buildSeoMetadata(slug));
    applyJsonLd(buildLandingPageJsonLd(config), 'landing');
  }, [isSeoLanding, slug]);

  return (
    <>
      <AnalyticsBoot />
      {isSeoLanding && slug ? (
        <Suspense fallback={landingFallback}>
          <SeoLandingView config={resolveLandingPage(slug)} />
        </Suspense>
      ) : (
        <Suspense fallback={homeFallback}>
          <App />
        </Suspense>
      )}
    </>
  );
}
