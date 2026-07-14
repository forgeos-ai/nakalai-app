import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllLandingPageSlugs,
  resolveLandingPage,
  RESERVED_STATIC_SLUGS,
} from '../../content/seo/landing-pages/registry';
import { buildSeoMetadata } from '../../src/seo/generateMetadata';
import { buildLandingPageJsonLd } from '../../content/seo/schemas/jsonLd';
import SeoLandingView from '../../src/seo/SeoLandingView';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Programmatic SEO — one dynamic route, 30+ config-driven landing pages.
 * Add pages by appending a LandingPageConfig object to content/seo/landing-pages/.
 */
export async function generateStaticParams() {
  return getAllLandingPageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_STATIC_SLUGS.has(slug)) {
    return { title: 'NakalAI', robots: { index: false, follow: true } };
  }
  return buildSeoMetadata(slug);
}

export default async function SeoKeywordPage({ params }: PageProps) {
  const { slug } = await params;

  if (RESERVED_STATIC_SLUGS.has(slug)) {
    notFound();
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
