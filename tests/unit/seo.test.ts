import { afterEach, expect, test, vi } from 'vitest';
import robots from '@/app/robots';
import {
  appMetadata,
  indexingAllowed,
  pageMetadata,
  publicSiteAllowed,
  siteOrigin,
  siteVerification,
  websiteStructuredData,
} from '@/lib/data/seo';
import { fixtureApps } from '@/lib/data/fixtures';
import type { Locale, RealDirectoryApp } from '@/lib/directory/types';
import { seoConfig } from '@/messages/seo';

const production = {
  PUBLIC_INDEXING: 'true',
  NODE_ENV: 'production',
  VERCEL_ENV: 'production',
  DIRECTORY_DATA_SOURCE: 'postgres',
  NEXT_PUBLIC_SITE_URL: 'https://example.com',
};

afterEach(() => vi.unstubAllEnvs());

function productionEnvironment(overrides: Record<string, string | undefined> = {}) {
  for (const [name, value] of Object.entries({ ...production, ...overrides }))
    vi.stubEnv(name, value);
}

function realApp(): RealDirectoryApp {
  return {
    ...fixtureApps[0],
    names: { ...fixtureApps[0].names },
    fictional: false,
    evidence: [],
    features: [],
    storeUrl: 'https://apps.apple.com/kr/app/id123456',
    currentVersion: null,
    supportVersion: null,
    investigationReason: null,
    previousSlugs: [],
  };
}

test('unsupported URL locales return a Next.js 404 instead of failing metadata lookup', () => {
  const unsupported = 'fr' as Locale;
  expect(() => pageMetadata(unsupported, 'home', production)).toThrow(
    'NEXT_HTTP_ERROR_FALLBACK;404',
  );
  expect(() => appMetadata(unsupported, fixtureApps[0], production)).toThrow(
    'NEXT_HTTP_ERROR_FALLBACK;404',
  );
});

test('indexing requires deliberate production and real-data configuration', () => {
  expect(indexingAllowed(production)).toBe(true);
  for (const change of [
    { PUBLIC_INDEXING: '' },
    { NODE_ENV: 'development' },
    { VERCEL_ENV: 'preview' },
    { DIRECTORY_DATA_SOURCE: 'fixtures' },
    { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
    { NEXT_PUBLIC_SITE_URL: 'https://localhost' },
    { NEXT_PUBLIC_SITE_URL: 'https://preview.internal' },
    { NEXT_PUBLIC_SITE_URL: 'https://example.com/path' },
    { NEXT_PUBLIC_SITE_URL: 'https://user:password@example.com' },
  ])
    expect(indexingAllowed({ ...production, ...change })).toBe(false);
});

test('public sharing does not require search indexing but still requires a real production site', () => {
  const unindexed = { ...production, PUBLIC_INDEXING: 'false' };
  expect(publicSiteAllowed(unindexed)).toBe(true);
  expect(indexingAllowed(unindexed)).toBe(false);
  expect(publicSiteAllowed({ ...unindexed, VERCEL_ENV: 'preview' })).toBe(false);
  expect(publicSiteAllowed({ ...unindexed, DIRECTORY_DATA_SOURCE: 'fixtures' })).toBe(false);
});

test('unindexed production permits sharing crawlers while keeping general search crawling blocked', () => {
  productionEnvironment({ PUBLIC_INDEXING: 'false' });
  const output = robots();
  expect(output.sitemap).toBeUndefined();
  expect(output.rules).toEqual([
    { userAgent: '*', disallow: '/' },
    {
      userAgent: expect.arrayContaining(['Twitterbot', 'Slackbot', 'kakaotalk-scrap']),
      allow: ['/', '/api/og/'],
      disallow: ['/ko/admin', '/en/admin', '/api/'],
    },
  ]);
  const serializedRules = JSON.stringify(output.rules);
  expect(serializedRules).not.toMatch(/Googlebot|Bingbot|Yeti/);
});

test.each([
  { DIRECTORY_DATA_SOURCE: 'fixtures' },
  { VERCEL_ENV: 'preview' },
  { NODE_ENV: 'development' },
  { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
])('nonpublic configuration %j does not grant a sharing crawler exception', (overrides) => {
  productionEnvironment(overrides);
  expect(robots()).toEqual({ rules: [{ userAgent: '*', disallow: '/' }] });
});

test('indexable production advertises the sitemap while keeping admin and other APIs excluded', () => {
  productionEnvironment();
  expect(robots()).toMatchObject({
    sitemap: 'https://example.com/sitemap.xml',
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og/'],
        disallow: ['/ko/admin', '/en/admin', '/api/'],
      },
      { userAgent: expect.arrayContaining(['kakaotalk-scrap']) },
    ],
  });
});

test.each(['ko', 'en'] as const)(
  '%s pages publish matching search and sharing metadata',
  (locale) => {
    for (const page of ['home', 'updates', 'methodology', 'submit'] as const) {
      const metadata = pageMetadata(locale, page, production);
      const path = page === 'home' ? '' : `/${page}`;
      const canonical = `https://example.com/${locale}${path}`;
      const copy = seoConfig.locales[locale][page];
      const title = page === 'home' ? copy.title : `${copy.title} · Is Duo Ready?`;
      expect(metadata).toMatchObject({
        title,
        description: copy.description,
        alternates: {
          canonical,
          languages: {
            ko: `https://example.com/ko${path}`,
            en: `https://example.com/en${path}`,
            'x-default': `https://example.com/en${path}`,
          },
        },
        robots: { index: page !== 'submit', follow: true },
        openGraph: {
          title,
          description: copy.description,
          url: canonical,
          locale: locale === 'ko' ? 'ko_KR' : 'en_US',
          images: [
            {
              url: `https://example.com/api/og/${locale}?v=${encodeURIComponent(seoConfig.imageVersion)}`,
              width: 1200,
              height: 630,
            },
          ],
        },
        twitter: { card: 'summary_large_image', title, description: copy.description },
      });
      expect(metadata.twitter).toHaveProperty('images', metadata.openGraph?.images);
    }
  },
);

test('fixture pages describe fictional data and never allow indexing', () => {
  expect(
    pageMetadata('en', 'home', { ...production, DIRECTORY_DATA_SOURCE: 'fixtures' }),
  ).toMatchObject({
    description: seoConfig.locales.en.fixtureDescription,
    robots: { index: false, follow: false },
  });
  expect(appMetadata('ko', fixtureApps[0], production)).toMatchObject({
    description: seoConfig.locales.ko.fixtureDescription,
    robots: { index: false },
  });
});

test('app descriptions use current translations or the original source when a translation is stale', () => {
  const app = realApp();
  app.translations = {
    ko: { summary: '원문\n  앱 설명', state: 'current' },
    en: { summary: 'Current English summary.', state: 'current' },
  };
  expect(appMetadata('en', app, production).description).toBe('Current English summary.');
  app.translations.en!.state = 'needs-review';
  expect(appMetadata('en', app, production).description).toBe('원문 앱 설명');
  delete app.translations.en;
  expect(appMetadata('en', app, production).description).toBe('원문 앱 설명');
});

test('missing app summaries use a localized template without inventing support evidence', () => {
  const app = realApp();
  app.translations = {};
  app.names.en = 'A $& app';
  expect(appMetadata('en', app, production)).toMatchObject({
    title: 'A $& app — iPhone Duo support · Is Duo Ready?',
    description:
      'Check A $& app’s iPhone Duo support status, official sources and supported version.',
    alternates: { canonical: 'https://example.com/en/apps/sample-01' },
  });
});

test('long app summaries are shortened without splitting Unicode characters', () => {
  const app = realApp();
  app.translations = { ko: { summary: '😀'.repeat(181), state: 'current' } };
  expect(appMetadata('ko', app, production).description).toBe('😀'.repeat(180) + '…');
});

test('origins use the configured site and reject credentials or unsafe schemes', () => {
  expect(siteOrigin({})).toBe('https://is-duo-ready.vercel.app');
  expect(siteOrigin({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })).toBe(
    'http://localhost:3000',
  );
  expect(() => siteOrigin({ NEXT_PUBLIC_SITE_URL: 'javascript:alert(1)' })).toThrow();
  expect(() => siteOrigin({ NEXT_PUBLIC_SITE_URL: 'https://user:password@example.com' })).toThrow();
});

test('structured data remains valid JSON and cannot close the script element', () => {
  const previous = seoConfig.siteName;
  const name = '</script><script>alert(1)</script>';
  try {
    seoConfig.siteName = name;
    const json = websiteStructuredData('ko', production);
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toMatchObject({
      '@type': 'WebSite',
      name,
      url: 'https://example.com/ko',
      inLanguage: 'ko',
    });
  } finally {
    seoConfig.siteName = previous;
  }
});

test('verification tags are omitted until real provider tokens are configured', () => {
  expect(siteVerification()).toEqual({ other: {} });
  const previous = { ...seoConfig.verification };
  try {
    Object.assign(seoConfig.verification, {
      google: 'test-google',
      naver: 'test-naver',
      bing: 'test-bing',
    });
    expect(siteVerification()).toEqual({
      google: 'test-google',
      other: { 'naver-site-verification': 'test-naver', 'msvalidate.01': 'test-bing' },
    });
  } finally {
    Object.assign(seoConfig.verification, previous);
  }
});
