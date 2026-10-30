import { waitForDevice } from './wait-for-device';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import { selectOption, fieldName } from './select-option';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Client } from 'pg';
import { connect, asActor } from '../integration/helpers.ts';

async function seed(suffix: string) {
  const client = await connect();
  const payload = {
    app_store_id: `990003${suffix}`,
    slug: `fictional-public-${suffix}`,
    name: `Fictional public ${suffix}`,
    developer: 'Test only developer',
    category: 'productivity',
    original_locale: 'en',
    aliases: [`공개검증${suffix}`],
    status: 'supported',
    current_version: '3.0',
    support_version: '2.0',
    translations: {
      en: {
        name: `Fictional public ${suffix}`,
        summary: 'Fictional public test. No actual support claim.',
        state: 'current',
      },
    },
    evidence: [
      {
        url: `https://example.com/fictional-${suffix}`,
        title: 'Fictional official source for testing',
        kind: 'developer',
        official_confirmed: true,
        quote: 'Fictional support claim <script>window.fakeEvidence=true</script>',
        support_version: '2.0',
        features: [{ key: 'wide-layout', description: 'Fictional evidenced feature' }],
      },
    ],
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
      await expect(page.getByText('Fictional public review', { exact: true })).toBeVisible();
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
      await page.goto(`/${locale}/updates`);
      await expect(
        page.getByRole('link', { name: `Fictional public ${suffix}`, exact: true }),
      ).toBeVisible();
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
