import { SITE_NAME, SITE_URL } from '../metadata/site';
import type { LandingPageConfig } from '../landing-pages/types';
import type { ResolvedLandingPage } from '../landing-pages/registry';

export function buildBreadcrumbJsonLd(page: ResolvedLandingPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.h1,
        item: `${SITE_URL}${page.canonicalPath}`,
      },
    ],
  };
}

export function buildFaqJsonLd(page: LandingPageConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildWebPageJsonLd(page: ResolvedLandingPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.description,
    url: `${SITE_URL}${page.canonicalPath}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: {
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
    },
  };
}

/** Combined JSON-LD graph for a landing page. */
export function buildLandingPageJsonLd(page: ResolvedLandingPage) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebPageJsonLd(page),
      buildBreadcrumbJsonLd(page),
      buildFaqJsonLd(page),
    ],
  };
}
