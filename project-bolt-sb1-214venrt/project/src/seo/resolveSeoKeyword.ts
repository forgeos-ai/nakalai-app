import {
  getAllLandingPageSlugs,
  resolveLandingPage,
  RESERVED_STATIC_SLUGS,
  type ResolvedLandingPage,
} from '../../content/seo/landing-pages/registry';

export type {
  ResolvedLandingPage,
  ResolvedLandingPage as ResolvedSeoKeyword,
};

export { RESERVED_STATIC_SLUGS };

/** @deprecated Use resolveLandingPage */
export function resolveSeoKeyword(
  slug: string | undefined | null,
): ResolvedLandingPage {
  return resolveLandingPage(slug);
}

/** @deprecated Use getAllLandingPageSlugs */
export function getAllSeoKeywordSlugs(): string[] {
  return getAllLandingPageSlugs();
}
