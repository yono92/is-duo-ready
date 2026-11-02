import { expect, test } from 'vitest';
import { autoAdsAllowed } from '@/lib/data/adsense';

const production = {
  ADSENSE_AUTO_ADS_ENABLED: 'true',
  NODE_ENV: 'production',
  VERCEL_ENV: 'production',
  DIRECTORY_DATA_SOURCE: 'postgres',
  NEXT_PUBLIC_SITE_URL: 'https://is-duo-ready.vercel.app',
};

test('auto ads require an explicit production opt-in and actual published content', () => {
  expect(autoAdsAllowed(true, production)).toBe(true);
  expect(autoAdsAllowed(false, production)).toBe(false);
  expect(autoAdsAllowed(true, {})).toBe(false);
  for (const overrides of [
    { ADSENSE_AUTO_ADS_ENABLED: undefined },
    { ADSENSE_AUTO_ADS_ENABLED: 'false' },
    { NODE_ENV: 'development' },
    { NODE_ENV: 'test' },
    { VERCEL_ENV: undefined },
    { VERCEL_ENV: 'preview' },
    { DIRECTORY_DATA_SOURCE: 'fixtures' },
    { DIRECTORY_DATA_SOURCE: undefined },
    { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
  ]) {
    expect(autoAdsAllowed(true, { ...production, ...overrides })).toBe(false);
  }
});

test('search indexing and advertising are independent switches', () => {
  expect(autoAdsAllowed(true, { ...production, PUBLIC_INDEXING: 'false' })).toBe(true);
  expect(
    autoAdsAllowed(true, {
      ...production,
      PUBLIC_INDEXING: 'true',
      ADSENSE_AUTO_ADS_ENABLED: 'false',
    }),
  ).toBe(false);
});
