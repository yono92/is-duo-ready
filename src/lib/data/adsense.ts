import { publicSiteAllowed } from '@/lib/data/seo';
import { adContentReviews } from '@/lib/data/ad-content-reviews';

export const adsensePublisher = 'ca-pub-8224851078290204';

// Only document-style pages may ever carry ads, and only after an exact-path review.
// Directory, search, history, submission, privacy, about and admin pages never qualify.
const adEligiblePath = /^\/(ko|en)\/(apps\/[a-z0-9-]+|methodology|reports\/\d{4}-\d{2}-\d{2})$/;

// Verification/crawler access must remain available while page ads are paused.
export function adsenseConfigured(env: Record<string, string | undefined> = process.env) {
  return env.ADSENSE_AUTO_ADS_ENABLED === 'true' && publicSiteAllowed(env);
}

export function autoAdsAllowed(
  hasRealContent: boolean,
  pagePath: string,
  env: Record<string, string | undefined> = process.env,
) {
  return (
    hasRealContent &&
    adsenseConfigured(env) &&
    adEligiblePath.test(pagePath) &&
    Object.hasOwn(adContentReviews, pagePath) &&
    Boolean(adContentReviews[pagePath]?.trim())
  );
}
