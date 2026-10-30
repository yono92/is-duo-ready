import { waitForDevice } from './wait-for-device';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import { selectOption, fieldName } from './select-option';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function chooseLanguage(page: Page, current: 'ko' | 'en', next: 'ko' | 'en') {
  await page
    .getByRole('button', {
      name: current === 'ko' ? ko.Preferences.language : en.Preferences.language,
      exact: true,
    })
    .click();
  await page
    .getByRole('menuitemradio', {
      name: next === 'ko' ? ko.Preferences.ko : en.Preferences.en,
      exact: true,
    })
    .click();
}

async function chooseTheme(page: Page, locale: 'ko' | 'en', theme: 'light' | 'dark') {
  const toggle = page.getByRole('switch', {
    name: locale === 'ko' ? ko.Preferences.darkMode : en.Preferences.darkMode,
    exact: true,
  });
  await expect(toggle).toBeEnabled();
  const checked = theme === 'dark';
  await toggle.setChecked(checked);
  await expect(toggle).toBeChecked({ checked });
}

test('root negotiation, saved preference and explicit locale priority', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'ko-KR' });
  const page = await context.newPage();
  await page.goto('/');
  await waitForDevice(page);
  await expect(page).toHaveURL(/\/ko$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await chooseLanguage(page, 'ko', 'en');
  await expect(page).toHaveURL(/\/en$/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
  await page.goto('/ko');
  await expect(page).toHaveURL(/\/ko$/);
  await context.close();
  const unsupported = await browser.newContext({ locale: 'fr-FR' });
  const other = await unsupported.newPage();
  await other.goto('/');
  await expect(other).toHaveURL(/\/en$/);
  await unsupported.close();
});

test('search, history, filter, locale and detail preserve context', async ({ page }) => {
  // This scenario now boots several complete documents when switching locale.
  test.setTimeout(60000);
  await page.goto('/ko');
  await waitForDevice(page);
  await page.getByRole('searchbox', { name: ko.Directory.search }).fill('메모');
  await page.getByRole('button', { name: ko.Directory.searchButton, exact: true }).click();
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByTestId('app-card')).toHaveCount(1);
  await expect(page.getByTestId('app-card')).toContainText('종이숲');
  await page.getByRole('main').getByRole('link', { name: ko.Home.browse, exact: true }).click();
  await expect(page).toHaveURL(/q=.+#directory-heading$/);
  await expect(page.getByRole('searchbox')).toHaveValue('메모');
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(ko.Directory.status), exact: true }),
    ko.Status['supported'],
  );
  await expect(page).toHaveURL(/status=supported/);
  await chooseLanguage(page, 'ko', 'en');
  await expect(page).toHaveURL(/\/en\?q=.*status=supported/);
  await waitForDevice(page);
  await expect(page.getByText(en.Home.region)).toBeVisible();
  await page.getByTestId('app-card').click();
  await expect(page).toHaveURL(/\/en\/apps\/sample-01\?q=/);
  await expect(page.getByText(en.Detail.evidenceEmpty, { exact: true })).toBeVisible();
  await chooseLanguage(page, 'en', 'ko');
  await expect(page).toHaveURL(/\/ko\/apps\/sample-01\?q=.*status=supported/);
  await page.getByRole('link', { name: ko.Directory.back }).click();
  await waitForDevice(page);
  await expect(page.getByRole('searchbox')).toHaveValue('메모');
  await page.getByRole('button', { name: ko.Directory.reset, exact: true }).click();
  await expect(page.getByTestId('app-card')).toHaveCount(24);
  await page.goBack();
  await expect(page.getByRole('searchbox')).toHaveValue('메모');
  await expect(page.getByTestId('app-card')).toHaveCount(1);
});

test('pagination, sorting, filters and query normalization', async ({ page }) => {
  await page.goto('/en');
  await waitForDevice(page);
  await page.getByRole('button', { name: en.Directory.next }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByTestId('app-card')).toHaveCount(6);
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(en.Directory.sort) }),
    en.Directory.name,
  );
  await expect(page).toHaveURL(/sort=name$/);
  await expect(page.getByTestId('app-card')).toHaveCount(24);
  await page.getByRole('button', { name: en.Categories['graphics-design'], exact: true }).click();
  await expect(page).toHaveURL(/category=graphics-design/);
  await selectOption(
    page,
    page.getByRole('combobox', { name: fieldName(en.Directory.status), exact: true }),
    en.Status['planned'],
  );
  await expect(page.getByTestId('app-card')).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole('button', { name: en.Categories['graphics-design'], exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/en?page=9999');
  await waitForDevice(page);
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByTestId('app-card')).toHaveCount(6);
  await page.goto('/en?page=-2&status=bogus');
  await waitForDevice(page);
  await expect(page.getByTestId('app-card')).toHaveCount(24);
});

test('empty state reset and scoped navigation work', async ({ page }) => {
  await page.goto('/en?q=does-not-exist');
  await waitForDevice(page);
  await expect(page.getByRole('heading', { name: en.Directory.emptyTitle })).toBeVisible();
  await page.getByRole('link', { name: en.Nav.submit, exact: true }).last().click();
  await expect(page.getByRole('heading', { name: en.Submission.title })).toBeVisible();
  await expect(
    page.getByText(en.Submission.errors.unavailable, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: en.Submission.send, exact: true })).toBeDisabled();
  await page.getByRole('link', { name: en.Nav.updates, exact: true }).click();
  await expect(page.getByRole('heading', { name: en.Updates.title })).toBeVisible();
  await expect(page.getByText(en.Updates.unavailable, { exact: true })).toBeVisible();
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: en.Footer.methodology, exact: true })
    .click();
  await expect(page.getByRole('heading', { name: en.Info.methodologyTitle })).toBeVisible();
});

test('missing and stale translations show original notice and preserve region', async ({
  page,
}) => {
  for (const slug of ['sample-02', 'sample-03']) {
    await page.goto(`/en/apps/${slug}`);
    await expect(page.getByText(en.Directory.original)).toBeVisible();
    await expect(page.locator('p[lang="ko"]')).toBeVisible();
    await expect(page.getByText(en.Home.region)).toBeVisible();
  }
});

test('theme follows OS by default and remembers an explicit toggle without hydration errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/en');
  await waitForDevice(page);
  const toggle = page.getByRole('switch', { name: en.Preferences.darkMode, exact: true });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(toggle).toBeChecked();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/light/);
  await expect(toggle).not.toBeChecked();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.reload();
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/light/);
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toBeChecked();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(toggle).toBeChecked();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toBeVisible();
  await expect(title).toHaveCSS('animation-name', 'none');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  const browse = page.getByRole('main').getByRole('link', { name: en.Home.browse, exact: true });
  await browse.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: en.Nav.explore, exact: true })).toBeInViewport();
  const card = page.getByRole('main').getByTestId('app-card').first();
  await card.hover();
  await expect(card).toHaveCSS('transform', 'none');
  expect(errors).toEqual([]);
});

test('mobile filters count, reset, keyboard focus and close', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en');
  await waitForDevice(page);
  const trigger = page.getByRole('button', { name: /^Filters/ });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: en.Categories['graphics-design'], exact: true }).click();
  await expect(page).toHaveURL(/category=graphics-design/);
  await selectOption(
    page,
    dialog.getByRole('combobox', { name: fieldName(en.Directory.status) }),
    en.Status['planned'],
  );
  await expect(dialog.getByText('Filters · 2', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: en.Directory.reset }).click();
  await expect(page).toHaveURL(/\/en$/);
  await dialog.getByRole('button', { name: en.Directory.done }).click();
  await expect(page.getByTestId('app-card')).toHaveCount(24);
});

for (const locale of ['ko', 'en'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`responsive and accessible ${locale}/${theme}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`/${locale}`);
      await waitForDevice(page);
      await chooseTheme(page, locale, theme);
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      await expect(page.getByTestId('app-card')).toHaveCount(24);
      // Loading changes the enabled state and colors of the local 3D controls.
      const deviceModel = page.getByTestId('device-model');
      if (await deviceModel.count())
        await expect(deviceModel).toHaveAttribute('data-status', /^(ready|unavailable)$/, {
          timeout: 30000,
        });
      for (const width of [360, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        const columns = await page
          .locator('.app-grid:visible')
          .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(width === 360 ? 1 : width === 768 ? 2 : 3);
      }
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/${locale}-${theme}-desktop.png`,
        fullPage: false,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: `test-results/${locale}-${theme}-mobile.png`, fullPage: true });
    });
  }

test('mobile dialog accessibility', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en');
  await waitForDevice(page);
  await page.getByRole('button', { name: /^Filters/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').evaluate(async (dialog) => {
    await Promise.all(dialog.getAnimations().map((animation) => animation.finished));
  });
  await page.screenshot({ path: 'test-results/astryx-mobile-filters.png' });
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('unknown app, page and locale do not expose fixtures', async ({ page }) => {
  await page.goto('/en/apps/missing');
  await expect(page.getByRole('heading', { name: en.NotFound.title })).toBeVisible();
  await page.goto('/ko/no-such-page');
  await expect(page.getByRole('heading', { name: ko.NotFound.title })).toBeVisible();
  const response = await page.goto('/fr');
  expect(response?.status()).toBe(404);
  await expect(page.getByTestId('app-card')).toHaveCount(0);
});

test('metadata and sitemap never advertise fixture pages', async ({ page, request }) => {
  await page.goto('/en?q=paper');
  await waitForDevice(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en$/);
  await expect(page.locator('link[hreflang="ko"]')).toHaveAttribute('href', /\/ko$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain('sample-');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
});

test('language menu stays icon-only, supports keyboard and returns focus', async ({ page }) => {
  await page.goto('/en');
  await waitForDevice(page);
  const trigger = page.getByRole('button', { name: en.Preferences.language, exact: true });
  await expect(trigger).toHaveText('');
  await expect(page.getByText(ko.Preferences.ko, { exact: true })).not.toBeVisible();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(
    page.getByRole('menuitemradio', { name: en.Preferences.en, exact: true }),
  ).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.press('ArrowDown');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(
    page.getByRole('menuitemradio', { name: ko.Preferences.ko, exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/ko$/);
  await expect(
    page.getByRole('switch', { name: ko.Preferences.darkMode, exact: true }),
  ).toHaveCount(1);
});
