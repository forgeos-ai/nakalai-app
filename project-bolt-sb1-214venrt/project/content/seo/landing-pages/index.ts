/**
 * NakalAI programmatic SEO — add pages by appending to a batch file.
 * @see content/seo/landing-pages/registry.ts
 */
export {
  landingPageRegistry,
  getAllLandingPageSlugs,
  resolveLandingPage,
  getRelatedLandingPages,
  RESERVED_STATIC_SLUGS,
  type ResolvedLandingPage,
} from './registry';

export type {
  LandingPageConfig,
  LandingFaq,
  LandingSection,
  HowItWorksStep,
} from './types';
