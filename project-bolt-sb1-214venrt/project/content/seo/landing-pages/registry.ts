import type { LandingPageConfig } from './types';
import { coreLandingPages } from './batch-core';
import { educationLandingPages } from './batch-education';
import { specialtyLandingPages } from './batch-specialty';

/** Paths reserved for static trust/blog pages — not keyword canvas landings. */
export const RESERVED_STATIC_SLUGS = new Set([
  'about',
  'privacy',
  'terms',
  'contact',
  'pricing',
  'faq',
  'refund-policy',
  'blog',
  'seo',
  'assets',
  'api',
  'models',
  'golden-lab',
]);

export type ResolvedLandingPage = LandingPageConfig & {
  usedFallback: boolean;
  canonicalPath: string;
};

const ALL_LANDING_PAGES: LandingPageConfig[] = [
  ...coreLandingPages,
  ...educationLandingPages,
  ...specialtyLandingPages,
];

/** Slug → config map — single registry for 30+ programmatic pages. */
export const landingPageRegistry: Record<string, LandingPageConfig> =
  Object.fromEntries(ALL_LANDING_PAGES.map((p) => [p.slug, p]));

export const LANDING_PAGE_SLUGS = Object.keys(landingPageRegistry);

export const DEFAULT_LANDING_PAGE: LandingPageConfig =
  landingPageRegistry['text-to-handwriting'] ??
  ALL_LANDING_PAGES[0]!;

export function getAllLandingPageSlugs(): string[] {
  return LANDING_PAGE_SLUGS;
}

export function getLandingPageBySlug(
  slug: string,
): LandingPageConfig | undefined {
  return landingPageRegistry[slug];
}

export function resolveLandingPage(
  slug: string | undefined | null,
): ResolvedLandingPage {
  const cleaned = (slug ?? '').replace(/^\/+|\/+$/g, '').toLowerCase();

  if (!cleaned || RESERVED_STATIC_SLUGS.has(cleaned)) {
    return {
      ...DEFAULT_LANDING_PAGE,
      usedFallback: true,
      canonicalPath: '/',
    };
  }

  const hit = landingPageRegistry[cleaned];
  if (hit) {
    return {
      ...hit,
      usedFallback: false,
      canonicalPath: `/${hit.slug}`,
    };
  }

  return {
    ...DEFAULT_LANDING_PAGE,
    slug: cleaned,
    usedFallback: true,
    canonicalPath: `/${cleaned}`,
  };
}

/** Related pages for internal linking — skips missing slugs. */
export function getRelatedLandingPages(
  slugs: string[],
): LandingPageConfig[] {
  const out: LandingPageConfig[] = [];
  const seen = new Set<string>();
  for (const s of slugs) {
    const p = landingPageRegistry[s];
    if (p && !seen.has(s)) {
      seen.add(s);
      out.push(p);
    }
  }
  return out;
}
