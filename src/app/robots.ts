import type { MetadataRoute } from 'next';
import { indexingAllowed, publicSiteAllowed, siteOrigin } from '@/lib/data/seo';
import { autoAdsAllowed } from '@/lib/data/adsense';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  const index = indexingAllowed(process.env);
  const ads = autoAdsAllowed(true);
  const publicPaths = {
    allow: ['/', '/api/og/'],
    disallow: ['/ko/admin', '/en/admin', '/api/'],
  };
  return {
    rules: [
      index
        ? { userAgent: '*', ...publicPaths }
        : { userAgent: '*', ...(ads ? { allow: '/ads.txt$' } : {}), disallow: '/' },
      ...(ads
        ? [
            {
              userAgent: ['Mediapartners-Google', 'Google-Display-Ads-Bot'],
              ...publicPaths,
            },
          ]
        : []),
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
