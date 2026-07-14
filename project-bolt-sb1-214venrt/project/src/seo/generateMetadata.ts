import type { Metadata } from 'next';
import {
  resolveSeoKeyword,
  type ResolvedSeoKeyword,
} from './resolveSeoKeyword';

const SITE = 'https://nakalai.in';

/**
 * Next.js Metadata API helper — used by app/[slug]/page.tsx generateMetadata.
 * Always resolves (unknown slugs → defaults), never throws.
 */
export function buildSeoMetadata(slug: string | undefined): Metadata {
  const seo = resolveSeoKeyword(slug);
  return seoConfigToMetadata(seo);
}

export function seoConfigToMetadata(seo: ResolvedSeoKeyword): Metadata {
  const url = `${SITE}${seo.canonicalPath === '/' ? '/' : seo.canonicalPath}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      siteName: 'NakalAI',
      title: seo.title,
      description: seo.description,
      url,
      images: [{ url: `${SITE}/og-nakalai.svg`, width: 1200, height: 630, alt: 'NakalAI' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [`${SITE}/og-nakalai.svg`],
    },
  };
}
