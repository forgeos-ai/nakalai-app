import type { PageMetadata } from '../../content/seo/metadata/types';
import { landingPageToMetadata } from '../../content/seo/metadata/buildMetadata';
import { resolveLandingPage } from '../../content/seo/landing-pages/registry';

export type { PageMetadata } from '../../content/seo/metadata/types';

/**
 * Build page metadata for a landing slug — used by the Vite SPA router.
 */
export function buildSeoMetadata(slug: string | undefined): PageMetadata {
  return landingPageToMetadata(resolveLandingPage(slug));
}
