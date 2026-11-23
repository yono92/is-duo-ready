import { afterEach, expect, test, vi } from 'vitest';
import { adsenseConfigured, autoAdsAllowed } from '@/lib/data/adsense';
import { AutoAds } from '@/components/auto-ads';

// Test-only editorial decisions: no live page is approved by these examples.
vi.mock('@/lib/data/ad-content-reviews', () => ({
  adContentReviews: {
    '/ko/apps/reviewed-example': 'Test-only review of original explanation and evidence.',
    '/ko/apps/blank-review': '   ',
    '/ko': 'Must not allow a directory even if listed by mistake.',
    '/ko/updates': 'Must not allow a history page even if listed by mistake.',
    '/ko/submit': 'Must not allow an action page even if listed by mistake.',
    '/ko/about': 'Must not allow the about page even if listed by mistake.',
    '/ko/reports': 'Must not allow the report index even if listed by mistake.',
    '/ko/privacy': 'Must not allow the privacy policy even if listed by mistake.',
    '/en/reports/2026-11-23': 'Test-only review of an update report.',
    '/en/methodology': 'Test-only review of the guide.',
  },
}));

const reviewedPath = '/ko/apps/reviewed-example';
const production = {
  ADSENSE_AUTO_ADS_ENABLED: 'true',
  NODE_ENV: 'production',
  VERCEL_ENV: 'production',
  DIRECTORY_DATA_SOURCE: 'postgres',
  NEXT_PUBLIC_SITE_URL: 'https://is-duo-ready.vercel.app',
};

afterEach(() => vi.unstubAllEnvs());

test('even reviewed content requires real production data and explicit opt-in', () => {
  expect(autoAdsAllowed(true, reviewedPath, production)).toBe(true);
  expect(autoAdsAllowed(false, reviewedPath, production)).toBe(false);
  expect(autoAdsAllowed(true, reviewedPath, {})).toBe(false);
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
    expect(autoAdsAllowed(true, reviewedPath, { ...production, ...overrides })).toBe(false);
  }
});

test.each([
  '/ko/apps/unreviewed-app',
  '/en/apps/reviewed-example',
  '/ko/apps/blank-review',
  '/ko/apps/reviewed-example-more',
  '/ko/apps/reviewed-example?query=test',
  '/ko',
  '/ko?query=app',
  '/ko?status=supported',
  '/ko?page=2',
  '/ko/updates',
  '/ko/admin',
  '/ko/submit',
  '/ko/privacy',
  '/ko/methodology',
  '/ko/about',
  '/ko/reports',
  '/ko/reports/2026-11-23',
  '/en/reports/2026-11-23/extra',
  '/en/reports/latest',
  'toString',
])('real data alone never authorizes advertising on %s', (path) => {
  expect(autoAdsAllowed(true, path, production)).toBe(false);
});

test.each(['/en/reports/2026-11-23', '/en/methodology'])(
  'reviewed document pages may carry ads: %s',
  (path) => {
    expect(autoAdsAllowed(true, path, production)).toBe(true);
    expect(autoAdsAllowed(false, path, production)).toBe(false);
  },
);

test('search indexing and advertising remain independent', () => {
  expect(autoAdsAllowed(true, reviewedPath, { ...production, PUBLIC_INDEXING: 'false' })).toBe(
    true,
  );
  expect(
    autoAdsAllowed(true, reviewedPath, {
      ...production,
      PUBLIC_INDEXING: 'true',
      ADSENSE_AUTO_ADS_ENABLED: 'false',
    }),
  ).toBe(false);
});

test('verification remains configured while an unreviewed page has no ad script', () => {
  for (const [name, value] of Object.entries(production)) vi.stubEnv(name, value);
  expect(adsenseConfigured()).toBe(true);
  expect(AutoAds({ hasRealContent: true, pagePath: '/ko/apps/unreviewed-app' })).toBeNull();
  expect(AutoAds({ hasRealContent: false, pagePath: reviewedPath })).toBeNull();
  const script = AutoAds({ hasRealContent: true, pagePath: reviewedPath });
  expect(script?.props).toMatchObject({ id: 'adsense-auto-ads', strategy: 'lazyOnload' });
});

test('the shipped review list covers only reviewed document pages, never app pages', async () => {
  const actual = await vi.importActual<typeof import('@/lib/data/ad-content-reviews')>(
    '@/lib/data/ad-content-reviews',
  );
  const { supportReports } = await import('@/lib/directory/reports');
  const reportDates = new Set(supportReports.map((report) => report.date));
  for (const [path, reason] of Object.entries(actual.adContentReviews)) {
    expect(path).toMatch(/^\/(ko|en)\/(methodology|reports\/\d{4}-\d{2}-\d{2})$/);
    expect(reason.trim().length).toBeGreaterThan(40);
    const date = /reports\/(.+)$/.exec(path)?.[1];
    if (date) expect(reportDates.has(date)).toBe(true);
  }
  // Each reviewed page is reviewed in both languages.
  const paths = Object.keys(actual.adContentReviews);
  for (const path of paths)
    expect(paths).toContain(path.replace(/^\/(ko|en)/, (_, l) => (l === 'ko' ? '/en' : '/ko')));
});
