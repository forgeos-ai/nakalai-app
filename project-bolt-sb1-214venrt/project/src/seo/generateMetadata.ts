import type { Metadata } from 'next';
import { landingPageToMetadata } from '../../content/seo/metadata/buildMetadata';
import { resolveLandingPage } from '../../content/seo/landing-pages/registry';

/**
 * Next.js Metadata API helper — used by app/[slug]/page.tsx generateMetadata.
 */
export function buildSeoMetadata(slug: string | undefined): Metadata {
  return landingPageToMetadata(resolveLandingPage(slug));
}
