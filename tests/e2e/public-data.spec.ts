import { waitForDevice } from './wait-for-device';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import { selectOption, fieldName } from './select-option';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Client } from 'pg';
import { connect, asActor } from '../integration/helpers.ts';
import { fictionalCharts } from '../fixtures/chart-rankings.ts';
import { syncChartRankings } from '../../scripts/lib/chart-rankings.ts';

async function seed(suffix: string, status: 'supported' | 'unknown' = 'supported') {
  const client = await connect();
  const payload = {
    app_store_id: `990003${suffix}`,
    slug: `fictional-public-${suffix}`,
    name: `Fictional public ${suffix}`,
    developer: 'Test only developer',
    category: 'productivity',
    original_locale: 'en',
    aliases: [`공개검증${suffix}`],
    status,
    investigation_reason: 'Fictional test; no confirmed support evidence for unknown fixtures',
    current_version: '3.0',
    support_version: '2.0',
    translations: {
      en: {
        name: `Fictional public ${suffix}`,
        summary: 'Fictional public test. No actual support claim.',
        state: 'current',
      },
    },
    evidence:
      status === 'supported'
        ? [
            {
              url: `https://example.com/fictional-${suffix}`,
              title: 'Fictional official source for testing',
              kind: 'developer',
              official_confirmed: true,
              quote: 'Fictional support claim <script>window.fakeEvidence=true</script>',
              support_version: '2.0',
              features: [{ key: 'wide-layout', description: 'Fictional evidenced feature' }],
            },
          ]
        : [],
  };
  try {
    return await asActor(client, process.env.LOCAL_ADMIN_USER_ID!, async (db: Client) => {
      const app = (
        await db.query('SELECT app_private.save_app($1::jsonb,NULL) AS app', [
          JSON.stringify(payload),
        ])
      ).rows[0].app;
      await db.query('SELECT app_private.publish_app($1,$2,$3,$4)', [
        app.id,
        app.revision,
        'Fictional public review',
        'PRIVATE E2E NOTE',
      ]);
      return { id: app.id, slug: payload.slug };
    });
  } finally {
    await client.end();
  }
}

test('free and paid chart sorts preserve the catalogue, source and mobile locale state', async ({
  page,
}) => {
  const suffixes = ['77301', '77302', '77303', '77304'];
  for (const suffix of suffixes)
    await seed(suffix, suffix === suffixes[1] ? 'unknown' : 'supported');
  const db = await connect();
  try {
    await asActor(db, process.env.LOCAL_ADMIN_USER_ID!, (client) =>
      syncChartRankings(
        client,
        fictionalCharts(
          [`990003${suffixes[1]}`, `990003${suffixes[2]}`, `990003${suffixes[0]}`],
          [`990003${suffixes[1]}`, `990003${suffixes[0]}`, `990003${suffixes[2]}`],
        ),
      ),
    );
  } finally {
    await db.end();
  }
  const search = 'Fictional public 773';
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/en?q=${encodeURIComponent(search)}&sort=top-free`);
  await waitForDevice(page);
  await expect(page.getByTestId('app-card')).toHaveCount(4);
  await expect(page.getByTestId('app-card').first()).toContainText(
    `Fictional public ${suffixes[2]}`,
  );
  await expect(page.getByTestId('chart-rank')).toHaveText(['#2', '#3', '#1']);
  await expect(page.getByTestId('app-card').nth(2)).toContainText(
    `Fictional public ${suffixes[3]}`,
  );
  await expect(page.getByTestId('app-card').last()).toContainText(
    `Fictional public ${suffixes[1]}`,
  );
  await expect(page.getByTestId('ranking-note').getByRole('link')).toHaveAttribute(
    'href',
    'https://rss.marketingtools.apple.com/api/v2/kr/apps/top-free/100/apps.json',
  );
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(en.Directory.sort) }),
    en.Directory.topPaid,
  );
  await expect(page).toHaveURL(/sort=top-paid/);
  await expect(page.getByTestId('app-card').first()).toContainText(
    `Fictional public ${suffixes[0]}`,
  );
  await expect(page.getByTestId('app-card')).toHaveCount(4);
  await expect(page.getByTestId('app-card').last()).toContainText(
    `Fictional public ${suffixes[1]}`,
  );
  await expect(page.getByTestId('ranking-note').getByRole('link')).toHaveAttribute(
    'href',
    'https://rss.marketingtools.apple.com/api/v2/kr/apps/top-paid/100/apps.json',
  );
  await page.screenshot({ path: 'test-results/rankings-en-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 1000 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`/ko?q=${encodeURIComponent(search)}&sort=top-paid`);
  await waitForDevice(page);
  await expect(page.getByRole('combobox', { name: fieldName(ko.Directory.sort) })).toContainText(
    ko.Directory.topPaid,
  );
  await expect(page.getByTestId('chart-rank')).toHaveText(['2위', '3위', '1위']);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/rankings-ko-mobile-dark.png', fullPage: true });
  await page.goto(`/ko?q=${encodeURIComponent(search)}&sort=recommended`);
  await expect(page.getByTestId('app-card')).toHaveCount(4);
  await expect(page.getByTestId('chart-rank')).toHaveCount(0);
  await expect(page.getByTestId('ranking-note')).toHaveCount(0);
});

for (const [index, locale] of ['ko', 'en'].entries())
  for (const [themeIndex, theme] of ['light', 'dark'].entries()) {
    test(`reviewed database app search and sources ${locale} ${theme}`, async ({
      page,
    }, testInfo) => {
      const suffix = `${index}${themeIndex}${testInfo.repeatEachIndex}101`;
      const app = await seed(suffix);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ colorScheme: theme as 'light' | 'dark' });
      await page.goto(`/${locale}?q=${encodeURIComponent(`공개검증${suffix}`)}`);
      await waitForDevice(page);
      await expect(page.getByTestId('app-card')).toHaveCount(1);
      await expect(
        page.getByText(locale === 'ko' ? ko.Home.fixture : en.Home.fixture, { exact: true }),
      ).toHaveCount(0);
      await page.getByTestId('app-card').click();
      await expect(page).toHaveURL(new RegExp(`/apps/${app.slug}\\?q=`));
      await expect(
        page.getByRole('link', { name: 'Fictional official source for testing' }),
      ).toHaveAttribute('href', `https://example.com/fictional-${suffix}`);
      await expect(page.getByText('Fictional evidenced feature', { exact: true })).toBeVisible();
      await expect(page.getByText('Fictional public review', { exact: true })).toHaveCount(0);
      await expect(
        page.getByRole('heading', {
          name: locale === 'ko' ? ko.Detail.history : en.Detail.history,
        }),
      ).toHaveCount(0);
      // Source cards show the evidence without publication-date metadata.
      await expect(page.locator('[id^="evidence-"]').getByText(/2026/)).toHaveCount(0);
      await expect(page.getByText('3.0', { exact: true })).toBeVisible();
      await expect(page.getByText('2.0', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => Object.hasOwn(window, 'fakeEvidence'))).toBe(false);
      await expect(page.getByText('PRIVATE E2E NOTE')).toHaveCount(0);
      if (locale === 'ko')
        await expect(page.getByText(ko.Directory.original, { exact: true })).toBeVisible();
      for (const width of [360, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          )
          .toBe(true);
        const scan = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(scan.violations).toEqual([]);
        if (width === 360 || width === 1440)
          await page.screenshot({
            path: `test-results/public-${locale}-${theme}-${width}.png`,
            fullPage: true,
          });
      }
      const client = await connect();
      try {
        await asActor(client, process.env.LOCAL_ADMIN_USER_ID!, async (db) => {
          await db.query(
            `UPDATE app_private.evidence SET quote=quote || ' Corrected source excerpt.'
            WHERE id IN (SELECT evidence_id FROM app_private.app_evidence WHERE app_id=$1)`,
            [app.id],
          );
          await db.query('SELECT app_private.publish_app($1,2,$2)', [
            app.id,
            'Fictional evidence correction',
          ]);
        });
      } finally {
        await client.end();
      }
      await page.reload();
      const messages = locale === 'ko' ? ko : en;
      await expect(page.getByRole('heading', { name: messages.Detail.history })).toBeVisible();
      await expect(
        page
          .getByRole('article')
          .getByText(messages.Updates.corrected.replace('{status}', messages.Status.supported), {
            exact: true,
          }),
      ).toBeVisible();
      await expect(
        page.getByRole('article').getByText('Fictional evidence correction', { exact: true }),
      ).toBeVisible();
      await expect(page.getByText('Fictional public review', { exact: true })).toHaveCount(0);
      await page.goto(`/${locale}/updates`);
      await expect(
        page
          .getByRole('listitem')
          .filter({
            has: page.getByRole('link', { name: `Fictional public ${suffix}`, exact: true }),
          })
          .filter({
            hasText: messages.Updates.initial.replace('{status}', messages.Status.supported),
          }),
      ).toBeVisible();
      await expect(page.getByText('Fictional public review', { exact: true })).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }

test('DB query failure renders an error instead of an empty result or fictional fallback', async ({
  page,
}) => {
  const client = await connect();
  try {
    await client.query('REVOKE SELECT ON public.directory_entries FROM anon');
    await page.goto('/en?q=database-outage-test');
    await expect(page.getByRole('heading', { name: en.Directory.errorTitle })).toBeVisible();
    await expect(page.getByText(en.Directory.emptyTitle, { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('app-card')).toHaveCount(0);
  } finally {
    await client.query('GRANT SELECT ON public.directory_entries TO anon');
    await client.end();
  }
});

test('review changes refresh both locales, old slugs redirect, and archiving hides both addresses', async ({
  page,
  context,
}, info) => {
  const app = await seed(`8${info.repeatEachIndex}201`);
  const visitor = await context.newPage();
  for (const locale of ['ko', 'en']) {
    await visitor.goto(`/${locale}/apps/${app.slug}`);
    await expect(visitor.getByRole('heading', { level: 1 })).toContainText('Fictional public');
  }
  await page.goto('/en/admin/login');
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.email), { exact: true })
    .fill(process.env.LOCAL_ADMIN_EMAIL!);
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.password), { exact: true })
    .fill(process.env.LOCAL_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: en.Admin.login, exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/apps$/);
  await page.goto(`/en/admin/apps/${app.id}`);
  const renamed = `${app.slug}-renamed`;
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.slug), { exact: true })
    .fill(renamed);
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(en.Admin.fields.status), exact: true }),
    en.Status['planned'],
  );
  await page.getByRole('button', { name: en.Admin.saveDraft, exact: true }).click();
  await expect(page).toHaveURL(/saved=1/);
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.changeReason), { exact: true })
    .fill('Fictional cache and alias review');
  await page
    .getByRole('checkbox', { name: fieldName(en.Admin.reviewConfirmation), exact: true })
    .check();
  await page.getByRole('button', { name: en.Admin.applyReview, exact: true }).click();
  await expect(page).toHaveURL(/reviewed=1/);
  for (const locale of ['ko', 'en']) {
    await visitor.goto(`/${locale}/apps/${app.slug}?q=Fictional`);
    await expect(visitor).toHaveURL(new RegExp(`/${locale}/apps/${renamed}\\?q=Fictional`));
    await expect(
      visitor.getByRole('main').getByText('Fictional cache and alias review', { exact: true }),
    ).toBeVisible();
    await expect(visitor.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/${locale}/apps/${renamed}$`),
    );
    await visitor.goto(`/${locale}?q=${encodeURIComponent(`공개검증8${info.repeatEachIndex}201`)}`);
    await waitForDevice(visitor);
    await expect(visitor.getByRole('main').getByTestId('app-card')).toHaveCount(1);
    await expect(visitor.getByRole('main').getByTestId('app-card')).toContainText(
      locale === 'ko' ? ko.Status.planned : en.Status.planned,
    );
    await visitor.goto(`/${locale}/updates`);
    await expect(
      visitor.getByRole('main').getByText('Fictional cache and alias review', { exact: true }),
    ).toBeVisible();
  }
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(en.Admin.fields.action), exact: true }),
    en.Admin.archive,
  );
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.changeReason), { exact: true })
    .fill('Fictional cache archival');
  await page
    .getByRole('checkbox', { name: fieldName(en.Admin.reviewConfirmation), exact: true })
    .check();
  await page.getByRole('button', { name: en.Admin.applyReview, exact: true }).click();
  await expect(page.getByText(en.Admin.publication.archived, { exact: true })).toBeVisible();
  for (const locale of ['ko', 'en']) {
    for (const slug of [app.slug, renamed]) {
      await visitor.goto(`/${locale}/apps/${slug}`);
      await expect(visitor.getByRole('heading', { level: 1 })).not.toContainText(
        'Fictional public',
      );
    }
    await visitor.goto(`/${locale}?q=${encodeURIComponent(`공개검증8${info.repeatEachIndex}201`)}`);
    await waitForDevice(visitor);
    await expect(visitor.getByRole('main').getByTestId('app-card')).toHaveCount(0);
    await visitor.goto(`/${locale}/updates`);
    await expect(
      visitor.getByRole('main').getByText('Fictional cache and alias review', { exact: true }),
    ).toHaveCount(0);
  }
  await visitor.close();
});
