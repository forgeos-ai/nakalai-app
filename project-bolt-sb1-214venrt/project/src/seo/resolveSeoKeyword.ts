import {
  seoKeywords,
  DEFAULT_SEO_KEYWORD,
  RESERVED_STATIC_SLUGS,
  type SeoKeywordConfig,
} from './seoKeywords';

export type ResolvedSeoKeyword = SeoKeywordConfig & {
  /** True when slug was missing from the matrix and defaults were applied */
  usedFallback: boolean;
  /** Canonical path including leading slash */
  canonicalPath: string;
};

/**
 * Look up keyword config by URL slug.
 * Unknown slugs gracefully fall back to DEFAULT_SEO_KEYWORD (no 404).
 */
export function resolveSeoKeyword(
  slug: string | undefined | null,
): ResolvedSeoKeyword {
  const cleaned = (slug ?? '').replace(/^\/+|\/+$/g, '').toLowerCase();

  if (!cleaned || RESERVED_STATIC_SLUGS.has(cleaned)) {
    return {
      ...DEFAULT_SEO_KEYWORD,
      usedFallback: true,
      canonicalPath: '/',
    };
  }

  const hit = seoKeywords[cleaned];
  if (hit) {
    return {
      ...hit,
      usedFallback: false,
      canonicalPath: `/${hit.slug}`,
    };
  }

  return {
    ...DEFAULT_SEO_KEYWORD,
    slug: cleaned,
    usedFallback: true,
    canonicalPath: `/${cleaned}`,
  };
}

export function getAllSeoKeywordSlugs(): string[] {
  return Object.keys(seoKeywords);
}
