import type { MetadataRoute } from 'next';
import { indexingAllowed, publicSiteAllowed, siteOrigin } from '@/lib/data/seo';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  const index = indexingAllowed(process.env);
  const publicPaths = {
    allow: ['/', '/api/og/'],
    disallow: ['/ko/admin', '/en/admin', '/api/'],
  };
  return {
    rules: [
      index ? { userAgent: '*', ...publicPaths } : { userAgent: '*', disallow: '/' },
      ...(publicSiteAllowed(process.env)
        ? [
            {
              userAgent: [
                'Twitterbot',
                'facebookexternalhit',
                'LinkedInBot',
                'Slackbot',
                'Discordbot',
                'TelegramBot',
                'WhatsApp',
                'kakaotalk-scrap',
              ],
              ...publicPaths,
            },
          ]
        : []),
    ],
    ...(index ? { sitemap: new URL('/sitemap.xml', siteOrigin()).toString() } : {}),
  };
}
