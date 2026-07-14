import {
  getAllLandingPageSlugs,
  resolveLandingPage,
  RESERVED_STATIC_SLUGS,
} from '../../content/seo/landing-pages/registry';
import { buildLandingPageJsonLd } from '../../content/seo/schemas/jsonLd';
import SeoLandingView from '../../src/seo/SeoLandingView';

type PageProps = {
  slug: string;
};

/**
 * Programmatic SEO landing — Vite SPA renders these via SpaRoot.
 * This module remains a plain React entry for the same configs (no Next.js).
 */
export function getStaticLandingSlugs(): string[] {
  return getAllLandingPageSlugs();
}

export default function SeoKeywordPage({ slug }: PageProps) {
  if (RESERVED_STATIC_SLUGS.has(slug)) {
    return null;
  }

  const config = resolveLandingPage(slug);
  const jsonLd = buildLandingPageJsonLd(config);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoLandingView config={config} />
    </>
  );
}
