import { getAllLandingPageSlugs } from '../content/seo/landing-pages/registry';
import { SITE_URL, STATIC_SITEMAP_PATHS } from '../content/seo/metadata/site';

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: 'weekly' | 'monthly' | 'yearly' | 'always' | 'hourly' | 'daily' | 'never';
  priority: number;
};

/** Plain sitemap data — mirrored by public/sitemap.xml for static hosting. */
export default function buildSitemap(): SitemapEntry[] {
  const now = new Date();
  const staticEntries: SitemapEntry[] = STATIC_SITEMAP_PATHS.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));

  const landingEntries: SitemapEntry[] = getAllLandingPageSlugs().map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...landingEntries];
}
