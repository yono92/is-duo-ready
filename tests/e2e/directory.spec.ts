import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function chooseLanguage(page: Page, current: 'ko' | 'en', next: 'ko' | 'en') {
  await page
    .getByRole('button', { name: current === 'ko' ? '언어' : 'Language', exact: true })
    .click();
  await page
    .getByRole('menuitemradio', { name: next === 'ko' ? '한국어' : 'English', exact: true })
    .click();
}

async function chooseTheme(page: Page, locale: 'ko' | 'en', theme: 'light' | 'dark') {
  const toggle = page.getByRole('switch', {
    name: locale === 'ko' ? '다크 모드' : 'Dark mode',
    exact: true,
  });
  await expect(toggle).toBeEnabled();
  const checked = String(theme === 'dark');
  if ((await toggle.getAttribute('aria-checked')) !== checked) await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', checked);
}

test('root negotiation, saved preference and explicit locale priority', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'ko-KR' });
  const page = await context.newPage();
  await page.goto('/');
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
  await page.goto('/ko');
  await page.getByRole('searchbox', { name: '앱 검색' }).fill('메모');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByTestId('app-card')).toHaveCount(1);
  await expect(page.getByTestId('app-card')).toContainText('종이숲');
  await page.getByRole('combobox', { name: '지원 상태', exact: true }).selectOption('supported');
  await expect(page).toHaveURL(/status=supported/);
  await chooseLanguage(page, 'ko', 'en');
  await expect(page).toHaveURL(/\/en\?q=.*status=supported/);
  await expect(page.getByText('South Korea App Store · KR')).toBeVisible();
  await page.getByTestId('app-card').click();
  await expect(page).toHaveURL(/\/en\/apps\/sample-01\?q=/);
  await expect(page.getByText('No evidence has been collected.', { exact: false })).toBeVisible();
  await chooseLanguage(page, 'en', 'ko');
  await expect(page).toHaveURL(/\/ko\/apps\/sample-01\?q=.*status=supported/);
  await page.getByRole('link', { name: '앱 목록으로' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('메모');
  await page.getByRole('button', { name: '전체 초기화', exact: true }).click();
  await expect(page.getByTestId('app-card')).toHaveCount(24);
  await page.goBack();
  await expect(page.getByRole('searchbox')).toHaveValue('메모');
  await expect(page.getByTestId('app-card')).toHaveCount(1);
});

test('pagination, sorting, filters and query normalization', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByTestId('app-card')).toHaveCount(6);
  await page.getByRole('combobox', { name: 'Sort by' }).selectOption('name');
  await expect(page).toHaveURL(/sort=name$/);
  await expect(page.getByTestId('app-card')).toHaveCount(24);
  await page.getByRole('button', { name: 'Graphics & Design', exact: true }).click();
  await expect(page).toHaveURL(/category=graphics-design/);
  await page.getByRole('combobox', { name: 'Support status', exact: true }).selectOption('planned');
  await expect(page.getByTestId('app-card')).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Graphics & Design', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/en?page=9999');
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByTestId('app-card')).toHaveCount(6);
  await page.goto('/en?page=-2&status=bogus');
  await expect(page.getByTestId('app-card')).toHaveCount(24);
});

test('empty state reset and scoped navigation work', async ({ page }) => {
  await page.goto('/en?q=does-not-exist');
  await expect(page.getByRole('heading', { name: 'No apps found. Yet.' })).toBeVisible();
  await page.getByRole('link', { name: 'Suggest an app', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Suggest an app or correction' })).toBeVisible();
  await expect(
    page.getByText('Reports cannot be received right now. Please try again later.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send report', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Updates', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recent support changes' })).toBeVisible();
  await expect(
    page.getByText('Reviewed change history is not connected in this preview.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Our methodology', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Evidence before a badge.' })).toBeVisible();
});

test('missing and stale translations show original notice and preserve region', async ({
  page,
}) => {
  for (const slug of ['sample-02', 'sample-03']) {
    await page.goto(`/en/apps/${slug}`);
    await expect(page.getByText('Shown in the original language')).toBeVisible();
    await expect(page.locator('p[lang="ko"]')).toBeVisible();
    await expect(page.getByText('South Korea App Store · KR')).toBeVisible();
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
  const toggle = page.getByRole('switch', { name: 'Dark mode', exact: true });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/light/);
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('html')).toHaveClass(/light/);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/light/);
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(errors).toEqual([]);
});

test('mobile filters count, reset, keyboard focus and close', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en');
  const trigger = page.getByRole('button', { name: /^Filters/ });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Graphics & Design', exact: true }).click();
  await expect(page).toHaveURL(/category=graphics-design/);
  await dialog.getByRole('combobox', { name: 'Support status' }).selectOption('planned');
  await expect(dialog.getByText('Filters · 2', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: 'Reset all' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await dialog.getByRole('button', { name: 'Show results' }).click();
  await expect(page.getByTestId('app-card')).toHaveCount(24);
});

for (const locale of ['ko', 'en'] as const)
  for (const theme of ['light', 'dark'] as const) {
    test(`responsive and accessible ${locale}/${theme}`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await chooseTheme(page, locale, theme);
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      await expect(page.getByTestId('app-card')).toHaveCount(24);
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
  await expect(page.getByRole('heading', { name: 'This page isn’t here.' })).toBeVisible();
  await page.goto('/ko/no-such-page');
  await expect(page.getByRole('heading', { name: '이 페이지를 찾을 수 없어요.' })).toBeVisible();
  const response = await page.goto('/fr');
  expect(response?.status()).toBe(404);
  await expect(page.getByTestId('app-card')).toHaveCount(0);
});

test('metadata and sitemap never advertise fixture pages', async ({ page, request }) => {
  await page.goto('/en?q=paper');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en$/);
  await expect(page.locator('link[hreflang="ko"]')).toHaveAttribute('href', /\/ko$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain('sample-');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
});

test('language menu stays icon-only, supports keyboard and returns focus', async ({ page }) => {
  await page.goto('/en');
  const trigger = page.getByRole('button', { name: 'Language', exact: true });
  await expect(trigger).toHaveText('');
  await expect(page.getByText('한국어', { exact: true })).not.toBeVisible();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menuitemradio', { name: 'English', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.press('ArrowDown');
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/ko$/);
  await expect(page.getByRole('switch', { name: '다크 모드', exact: true })).toHaveCount(1);
});
