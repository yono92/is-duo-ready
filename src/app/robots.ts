import type { MetadataRoute } from 'next';
import { indexingAllowed } from '@/lib/data/seo';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  if (indexingAllowed(process.env))
    return {
      rules: { userAgent: '*', allow: '/', disallow: ['/ko/admin', '/en/admin'] },
      sitemap: `${new URL('/sitemap.xml', process.env.NEXT_PUBLIC_SITE_URL).toString()}`,
    };
  return { rules: { userAgent: '*', disallow: '/' } };
}
