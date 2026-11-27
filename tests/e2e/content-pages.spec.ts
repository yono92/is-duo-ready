import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import reports from '../../src/data/support-reports.json' with { type: 'json' };

const messages = { ko, en } as const;
const latest = reports.reports[0];

for (const locale of ['ko', 'en'] as const) {
  const m = messages[locale];

  test(`${locale} about page explains operator, sources, limits and contact`, async ({ page }) => {
    await page.goto(`/${locale}/about`);
    await expect(page.getByRole('heading', { level: 1, name: m.About.title })).toBeVisible();
    for (const part of ['operator', 'sources', 'limits', 'updates', 'contact'] as const)
      await expect(
        page.getByRole('heading', { level: 2, name: m.About.sections[part].title }),
      ).toBeVisible();
    const github = page.getByRole('link', { name: m.About.links.github });
    await expect(github).toHaveAttribute(
      'href',
      'https://github.com/yono92/is-duo-ready/issues/new',
    );
    await expect(github).toHaveAttribute('rel', /noopener/);
    await page.getByRole('link', { name: m.About.links.reports }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/reports$`));
  });

  test(`${locale} report index leads to a report with verified totals and official quotes`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/reports`);
    await expect(page.getByRole('heading', { level: 1, name: m.Reports.title })).toBeVisible();
    await expect(page.getByTestId('report-card')).toHaveCount(reports.reports.length);
    await page.getByTestId('report-card').filter({ hasText: latest.title[locale] }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/reports/${latest.date}$`));
    await expect(page.getByRole('heading', { level: 1, name: latest.title[locale] })).toBeVisible();
    const stats = page.getByTestId('report-stats');
    await expect(stats).toContainText(latest.totals.supported.toLocaleString('en-US'));
    await expect(page.getByTestId('report-app')).toHaveCount(latest.apps.length);
    for (const app of latest.apps.slice(0, 3)) {
      const entry = page.getByTestId('report-app').filter({ hasText: app.summary[locale] });
      await expect(entry).toContainText(app.quote);
      await expect(entry.getByRole('link', { name: m.Reports.originalQuote })).toHaveAttribute(
        'href',
        app.sourceUrl,
      );
    }
    // Fixture previews cannot resolve real apps, so they never claim one was removed.
    await expect(page.getByText(m.Reports.notListed)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: m.Reports.notCountedTitle })).toBeVisible();
  });

  test(`${locale} unknown report dates are not found`, async ({ page }) => {
    const response = await page.goto(`/${locale}/reports/2000-01-01`);
    expect(response?.status()).toBe(404);
    await expect(page.getByText(m.NotFound.title)).toBeVisible();
    // Next.js may stream the not-found metadata once per boundary; any copy suffices.
    await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
    await expect(page.getByTestId('report-stats')).toHaveCount(0);
  });

  test(`${locale} header and footer expose the new pages`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByRole('banner').getByRole('link', { name: m.Nav.reports })).toBeVisible();
    const footer = page.getByRole('navigation', { name: m.Footer.navigation });
    await expect(footer.getByRole('link', { name: m.Footer.about })).toHaveAttribute(
      'href',
      `/${locale}/about`,
    );
    await expect(footer.getByRole('link', { name: m.Footer.reports })).toHaveAttribute(
      'href',
      `/${locale}/reports`,
    );
  });
}

for (const [path, width, theme] of [
  ['/ko/about', 360, 'light'],
  ['/en/about', 1440, 'dark'],
  ['/ko/reports', 768, 'dark'],
  [`/ko/reports/${latest.date}`, 360, 'dark'],
  [`/en/reports/${latest.date}`, 1440, 'light'],
] as const) {
  test(`${path} at ${width}px ${theme} has no overflow or axe violations`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(scan.violations).toEqual([]);
  });
}

test('report links and cards are reachable by keyboard', async ({ page }) => {
  await page.goto('/ko/reports');
  const card = page.getByRole('link', { name: latest.title.ko });
  for (let i = 0; i < 40 && !(await card.evaluate((el) => el === document.activeElement)); i++)
    await page.keyboard.press('Tab');
  await expect(card).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/ko/reports/${latest.date}$`));
});
