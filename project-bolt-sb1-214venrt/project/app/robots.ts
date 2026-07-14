import type { MetadataRoute } from 'next';
import { SITE_URL } from '../content/seo/metadata/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/assets/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
