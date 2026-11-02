import { publicSiteAllowed } from '@/lib/data/seo';

export const adsensePublisher = 'ca-pub-8224851078290204';

export function autoAdsAllowed(
  hasRealContent: boolean,
  env: Record<string, string | undefined> = process.env,
) {
  return hasRealContent && env.ADSENSE_AUTO_ADS_ENABLED === 'true' && publicSiteAllowed(env);
}
