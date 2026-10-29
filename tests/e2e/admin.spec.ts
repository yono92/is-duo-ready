import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { connect } from '../integration/helpers.ts';

async function login(page: Page, locale = 'en') {
  await page.goto(`/${locale}/admin/login`);
  await page
    .getByRole('main')
    .getByLabel(locale === 'en' ? 'Email' : '이메일', { exact: true })
    .fill(process.env.LOCAL_ADMIN_EMAIL!);
  await page
    .getByRole('main')
    .getByLabel(locale === 'en' ? 'Password' : '비밀번호', { exact: true })
    .fill(process.env.LOCAL_ADMIN_PASSWORD!);
  await page
    .getByRole('button', { name: locale === 'en' ? 'Sign in' : '로그인', exact: true })
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
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
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
  await page.getByRole('link', { name: 'Add an app', exact: true }).click();
  await page
    .getByRole('main')
    .getByLabel('Original app name', { exact: true })
    .fill('Fictional browser review app');
  await page.getByRole('main').getByLabel('Developer', { exact: true }).fill('Test only developer');
  await page
    .getByRole('main')
    .getByLabel('App Store ID', { exact: true })
    .fill(`9900000077${testInfo.repeatEachIndex.toString().padStart(2, '0')}`);
  await page
    .getByRole('main')
    .getByLabel('Page address', { exact: true })
    .fill(`fictional-browser-review-${testInfo.repeatEachIndex}`);
  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('productivity');
  await page.getByRole('combobox', { name: 'Original language', exact: true }).selectOption('en');
  const english = page.getByRole('heading', { name: 'English', exact: true }).locator('..');
  await english.getByLabel('Display name', { exact: true }).fill('Fictional browser review app');
  await english
    .getByLabel('Support summary', { exact: true })
    .fill('Fictional browser test. No real support claim.');
  await page
    .getByRole('main')
    .getByLabel('Investigation reason for “Needs verification”', { exact: true })
    .fill('Fictional test investigation only.');
  await page.getByRole('button', { name: 'Save draft changes', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/apps\/[a-f0-9-]+\?saved=1/);
  await expect(page.getByRole('status').filter({ hasText: 'Draft saved' })).toContainText(
    'Draft saved',
  );
  await page
    .getByRole('main')
    .getByLabel('Public change reason', { exact: true })
    .fill('Fictional initial review.');
  await page.getByRole('checkbox', { name: /I have reviewed the saved information/ }).check();
  await page.getByRole('button', { name: 'Apply reviewed change', exact: true }).click();
  await expect(page).toHaveURL(/reviewed=1/);
  await expect(
    page.getByRole('status').filter({ hasText: 'reviewed change was applied' }),
  ).toContainText('reviewed change was applied');
  await page
    .getByRole('combobox', { name: 'Publication action', exact: true })
    .selectOption('archive');
  await page
    .getByRole('main')
    .getByLabel('Public change reason', { exact: true })
    .fill('Fictional archival test.');
  await page.getByRole('checkbox', { name: /I have reviewed the saved information/ }).check();
  await page.getByRole('button', { name: 'Apply reviewed change', exact: true }).click();
  await expect(page.getByText('Archived', { exact: true })).toBeVisible();
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
    .getByLabel('Original app name', { exact: true })
    .fill('Fictional authorization test');
  await page.getByRole('main').getByLabel('Developer', { exact: true }).fill('Test only');
  const id = `990002${info.repeatEachIndex}700`;
  const deniedId = `990002${info.repeatEachIndex}701`;
  await page.getByRole('main').getByLabel('App Store ID', { exact: true }).fill(id);
  await page
    .getByRole('main')
    .getByLabel('Page address', { exact: true })
    .fill(`fictional-authorization-${info.repeatEachIndex}`);
  const requestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && Boolean(request.headers()['next-action']),
  );
  await page.getByRole('button', { name: 'Save draft changes', exact: true }).click();
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
