import Script from 'next/script';
import { adsensePublisher, autoAdsAllowed } from '@/lib/data/adsense';

export function AutoAds({ hasRealContent }: { hasRealContent: boolean }) {
  if (!autoAdsAllowed(hasRealContent)) return null;

  return (
    <Script
      id="adsense-auto-ads"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
