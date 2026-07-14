import { SITE_URL } from '../content/seo/metadata/site';

export type RobotsConfig = {
  rules: {
    userAgent: string;
    allow: string;
    disallow: string[];
  };
  sitemap: string;
};

/** Plain robots config — mirrored by public/robots.txt for static hosting. */
export default function buildRobots(): RobotsConfig {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/assets/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
