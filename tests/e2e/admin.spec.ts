import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import { selectOption, fieldName } from './select-option';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { connect } from '../integration/helpers.ts';

async function login(page: Page, locale = 'en') {
  await page.goto(`/${locale}/admin/login`);
  await page
    .getByRole('main')
    .getByLabel(fieldName(locale === 'en' ? en.Admin.email : ko.Admin.email), { exact: true })
    .fill(process.env.LOCAL_ADMIN_EMAIL!);
  await page
    .getByRole('main')
    .getByLabel(fieldName(locale === 'en' ? en.Admin.password : ko.Admin.password), { exact: true })
    .fill(process.env.LOCAL_ADMIN_PASSWORD!);
  await page
    .getByRole('button', { name: locale === 'en' ? en.Admin.login : ko.Admin.login, exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/apps$`));
}

test('anonymous admin access is denied and logout revokes the local session', async ({
  page,
  context,
}) => {
  await page.goto('/en/admin/apps');
  await expect(page).toHaveURL(/\/en\/admin\/login\?error=authRequired/);
  await login(page);
  const cookie = (await context.cookies()).find((item) => item.name === 'duo-local-admin');
  expect(cookie?.httpOnly).toBe(true);
  await page.getByRole('button', { name: en.Admin.logout, exact: true }).click();
  await expect(page).toHaveURL(/\/en\/admin\/login$/);
  await context.addCookies([cookie!]);
  await page.goto('/en/admin/apps');
  await expect(page).toHaveURL(/error=authRequired/);
});

test('administrator saves a draft, explicitly reviews it and archives it', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  await page.getByRole('link', { name: en.Admin.newApp, exact: true }).click();
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.name), { exact: true })
    .fill('Fictional browser review app');
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.developer), { exact: true })
    .fill('Test only developer');
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.app_store_id), { exact: true })
    .fill(`9900000077${testInfo.repeatEachIndex.toString().padStart(2, '0')}`);
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.slug), { exact: true })
    .fill(`fictional-browser-review-${testInfo.repeatEachIndex}`);
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(en.Admin.fields.category), exact: true }),
    en.Categories.productivity,
  );
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(en.Admin.fields.original_locale), exact: true }),
    en.Admin.languages.en,
  );
  const english = page
    .getByRole('heading', { name: en.Admin.languages.en, exact: true })
    .locator('..');
  await english
    .getByLabel(fieldName(en.Admin.fields.translatedName), { exact: true })
    .fill('Fictional browser review app');
  await english
    .getByLabel(fieldName(en.Admin.fields.summary), { exact: true })
    .fill('Fictional browser test. No real support claim.');
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.investigation_reason), { exact: true })
    .fill('Fictional test investigation only.');
  await page.getByRole('button', { name: en.Admin.saveDraft, exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/apps\/[a-f0-9-]+\?saved=1/);
  await expect(page.getByRole('status').filter({ hasText: en.Admin.saved })).toContainText(
    en.Admin.saved,
  );
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.changeReason), { exact: true })
    .fill('Fictional initial review.');
  await page
    .getByRole('checkbox', { name: fieldName(en.Admin.reviewConfirmation), exact: true })
    .check();
  await page.getByRole('button', { name: en.Admin.applyReview, exact: true }).click();
  await expect(page).toHaveURL(/reviewed=1/);
  await expect(page.getByRole('status').filter({ hasText: en.Admin.reviewed })).toContainText(
    en.Admin.reviewed,
  );
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(en.Admin.fields.action), exact: true }),
    en.Admin.archive,
  );
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.changeReason), { exact: true })
    .fill('Fictional archival test.');
  await page
    .getByRole('checkbox', { name: fieldName(en.Admin.reviewConfirmation), exact: true })
    .check();
  await page.getByRole('button', { name: en.Admin.applyReview, exact: true }).click();
  await expect(page.getByText(en.Admin.publication.archived, { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('revoked administrators and anonymous replay cannot invoke an existing save action', async ({
  page,
  browser,
}, info) => {
  await login(page);
  await page.goto('/en/admin/apps/new');
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.name), { exact: true })
    .fill('Fictional authorization test');
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.developer), { exact: true })
    .fill('Test only');
  const id = `990002${info.repeatEachIndex}700`;
  const deniedId = `990002${info.repeatEachIndex}701`;
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.app_store_id), { exact: true })
    .fill(id);
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Admin.fields.slug), { exact: true })
    .fill(`fictional-authorization-${info.repeatEachIndex}`);
  const requestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && Boolean(request.headers()['next-action']),
  );
  await page.getByRole('button', { name: en.Admin.saveDraft, exact: true }).click();
  const request = await requestPromise;
  await expect(page).toHaveURL(/saved=1/);
  const headers = await request.allHeaders();
  const replay = {
    headers: {
      'content-type': headers['content-type'],
      'next-action': headers['next-action'],
      origin: new URL(request.url()).origin,
    },
    data: request
      .postData()!
      .replaceAll(id, deniedId)
      .replaceAll(
        `fictional-authorization-${info.repeatEachIndex}`,
        `fictional-denied-${info.repeatEachIndex}`,
      ),
  };
  const db = await connect();
  const anonymous = await browser.newContext();
  try {
    const response = await anonymous.request.post(request.url(), replay);
    expect(await response.text()).toContain('authRequired');
    await db.query('UPDATE app_private.admin_users SET enabled=false WHERE user_id=$1', [
      process.env.LOCAL_ADMIN_USER_ID,
    ]);
    const denied = await page.request.post(request.url(), replay);
    expect(await denied.text()).toContain('forbidden');
    await page.goto('/en/admin/apps');
    await expect(page).toHaveURL(/error=forbidden/);
    expect(
      (
        await db.query('SELECT count(*)::int AS n FROM app_private.apps WHERE app_store_id=$1', [
          deniedId,
        ])
      ).rows[0].n,
    ).toBe(0);
  } finally {
    await db.query('UPDATE app_private.admin_users SET enabled=true WHERE user_id=$1', [
      process.env.LOCAL_ADMIN_USER_ID,
    ]);
    await db.end();
    await anonymous.close();
  }
});

for (const locale of ['ko', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`admin forms accessibility ${locale} ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme as 'light' | 'dark' });
      await login(page, locale);
      await page.goto(`/${locale}/admin/apps/new`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      for (const width of [360, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          )
          .toBe(true);
      }
      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(scan.violations).toEqual([]);
      await page.screenshot({ path: `test-results/admin-${locale}-${theme}.png`, fullPage: true });
    });
  }
