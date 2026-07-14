import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllSeoKeywordSlugs,
  resolveSeoKeyword,
} from '../../src/seo/resolveSeoKeyword';
import { RESERVED_STATIC_SLUGS } from '../../src/seo/seoKeywords';
import { buildSeoMetadata } from '../../src/seo/generateMetadata';
import SeoLandingView from '../../src/seo/SeoLandingView';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Programmatic SEO landing — App Router dynamic segment.
 *
 * - Known slugs → keyword matrix copy + preloaded canvas
 * - Unknown slugs → DEFAULT_SEO_KEYWORD (no crash / no hard 404)
 * - Reserved trust/blog slugs → notFound (handled by dedicated routes / static)
 */
export async function generateStaticParams() {
  return getAllSeoKeywordSlugs().map((slug) => ({ slug }));
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

  const config = resolveSeoKeyword(slug);
  return <SeoLandingView config={config} />;
}
