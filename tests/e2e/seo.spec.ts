import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { seoConfig } from '../../src/messages/seo';

function headOf(html: string) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1];
  expect(head, 'Metadata must be in the initial HTML head for sharing crawlers').toBeDefined();
  return head!;
}

function escapeAttribute(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const imageVersion = encodeURIComponent(seoConfig.imageVersion);
const imageVersionPattern = imageVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

for (const locale of ['ko', 'en'] as const) {
  test(`${locale} sharing metadata is in the HTML head for Kakao, Slack and Twitter`, async ({
    request,
  }) => {
    const copy = seoConfig.locales[locale];
    for (const userAgent of [
      'kakaotalk-scrap/1.0',
      'Slackbot-LinkExpanding 1.0',
      'Twitterbot/1.0',
    ]) {
      const response = await request.get(`/${locale}?q=paper`, {
        headers: { 'User-Agent': userAgent },
      });
      expect(response.status()).toBe(200);
      const head = headOf(await response.text());
      expect(head).toContain(
        `<meta property="og:title" content="${escapeAttribute(copy.home.title)}"`,
      );
      expect(head).toContain(
        `<meta property="og:description" content="${escapeAttribute(copy.fixtureDescription)}"`,
      );
      expect(head).toMatch(
        new RegExp(`<meta property="og:url" content="https?://[^"?]+/${locale}"`),
      );
      expect(head).toMatch(
        new RegExp(
          `<meta property="og:image" content="https?://[^" ]+/api/og/${locale}\\?v=${imageVersionPattern}"`,
        ),
      );
      expect(head).toContain('<meta name="twitter:card" content="summary_large_image"');
      expect(head).toContain('<meta name="robots" content="noindex, nofollow"');
      expect(head).toContain('rel="canonical"');
      expect(head).toContain('hrefLang="ko"');
      expect(head).toContain('hrefLang="en"');
    }
  });

  test(`${locale} app and information pages have their own sharing titles`, async ({ request }) => {
    const copy = seoConfig.locales[locale];
    for (const [path, title] of [
      ['/updates', `${copy.updates.title} · Is Duo Ready?`],
      ['/methodology', `${copy.methodology.title} · Is Duo Ready?`],
      [
        '/apps/sample-01',
        `${copy.appTitle.replace('{name}', locale === 'ko' ? '종이숲' : 'Paper Grove')} · Is Duo Ready?`,
      ],
    ]) {
      const response = await request.get(`/${locale}${path}`);
      expect(response.status()).toBe(200);
      const head = headOf(await response.text());
      expect(head).toContain(`<meta property="og:title" content="${escapeAttribute(title)}"`);
      expect(head).toContain('<meta name="robots" content="noindex, nofollow"');
    }
  });

  test(`${locale} social image is a complete 1200 by 630 PNG`, async ({ request }) => {
    const response = await request.get(`/api/og/${locale}?v=${imageVersion}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    const bytes = await response.body();
    const image = sharp(bytes);
    expect(await image.metadata()).toMatchObject({ format: 'png', width: 1200, height: 630 });
    const stats = await image.stats();
    expect(
      stats.channels.some((channel) => channel.stdev > 20),
      'The image must contain rendered artwork, not a blank background',
    ).toBe(true);
  });
}

test('unsupported image locales are rejected and admin pages remain private to crawlers', async ({
  request,
}) => {
  expect((await request.get('/api/og/fr')).status()).toBe(404);
  const response = await request.get('/ko/admin/login');
  expect(response.status()).toBe(200);
  expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
  expect(headOf(await response.text())).toContain(
    '<meta name="robots" content="noindex, nofollow"',
  );
});
