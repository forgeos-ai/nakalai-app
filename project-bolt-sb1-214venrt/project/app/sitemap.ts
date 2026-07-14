import type { MetadataRoute } from 'next';
import { getAllLandingPageSlugs } from '../content/seo/landing-pages/registry';
import { SITE_URL, STATIC_SITEMAP_PATHS } from '../content/seo/metadata/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_SITEMAP_PATHS.map(
    (path) => ({
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      lastModified: now,
      changeFrequency: path === '/' ? 'weekly' : 'monthly',
      priority: path === '/' ? 1 : 0.7,
    }),
  );

  const landingEntries: MetadataRoute.Sitemap = getAllLandingPageSlugs().map(
    (slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
  );

  return [...staticEntries, ...landingEntries];
}
