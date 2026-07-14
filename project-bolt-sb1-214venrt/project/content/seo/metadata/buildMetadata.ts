import type { PageMetadata } from './types';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from './site';
import {
  resolveLandingPage,
  type ResolvedLandingPage,
} from '../landing-pages/registry';

export type { PageMetadata, PageMetadataImage } from './types';

export function landingPageToMetadata(page: ResolvedLandingPage): PageMetadata {
  const url = `${SITE_URL}${page.canonicalPath === '/' ? '/' : page.canonicalPath}`;
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: page.title,
      description: page.description,
      url,
      locale: 'en_IN',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export function buildLandingMetadata(slug: string | undefined): PageMetadata {
  return landingPageToMetadata(resolveLandingPage(slug));
}
