import { expect, test } from '@playwright/test';

for (const locale of ['ko', 'en']) {
  test(`overview keeps published sample totals separate from search in ${locale}`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const overview = page.getByTestId('directory-stats');
    await expect(overview).toBeVisible();
    const values = await overview.locator('dd').allTextContents();
    expect(values.map(Number)).toEqual([8, 8, 6, 8]);
    await expect(overview.locator('[data-stat="total"]')).toContainText('30');
    await expect(overview.getByTestId('supported-count')).toHaveText('8');
    const distribution = overview.getByTestId('support-distribution');
    const segments = distribution.locator('svg path[data-status]');
    await expect(segments).toHaveCount(4);
    await expect(segments.first()).toHaveAttribute('aria-label', /26\.7%/);
    expect(await segments.first().evaluate((mark) => getComputedStyle(mark).fill)).toBe(
      'rgb(11, 153, 31)',
    );
    const widths = await distribution
      .locator('svg path[data-status]')
      .evaluateAll((segments) => segments.map((segment) => segment.getBoundingClientRect().width));
    const totalWidth = await distribution.evaluate((bar) => bar.getBoundingClientRect().width);
    for (const [index, count] of [8, 8, 6, 8].entries()) {
      expect(widths[index] / totalWidth).toBeCloseTo(count / 30, 2);
    }
    await segments.first().hover();
    await expect(distribution.locator('.recharts-tooltip-wrapper')).toContainText('26.7%');
    const chart = distribution.getByRole('application');
    await chart.focus();
    await chart.press('ArrowRight');
    await expect(distribution.locator('.recharts-tooltip-wrapper')).toContainText('26.7%');
    await page.goto(`/${locale}?q=no-such-app&status=supported`);
    await expect(page.getByTestId('directory-stats').locator('dd')).toHaveText(values);
    await expect(page.getByTestId('app-card')).toHaveCount(0);
    await page.setViewportSize({ width: 360, height: 900 });
    await expect(page.getByTestId('support-distribution').locator('svg')).toBeVisible();
    await expect
      .poll(async () => {
        const chart = page.getByTestId('support-distribution');
        return chart.evaluate((container) => {
          const svg = container.querySelector('svg');
          return Math.abs((svg?.getBoundingClientRect().width ?? 0) - container.clientWidth);
        });
      })
      .toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(overview).toContainText(
      locale === 'ko' ? '가상 예시 앱' : 'fictional sample apps',
    );
  });
}

test.describe('server-rendered overview', () => {
  test.use({ javaScriptEnabled: false });

  test('counts remain readable without the chart runtime', async ({ page }) => {
    await page.goto('/ko');
    const overview = page.getByTestId('directory-stats');
    await expect(overview.locator('[data-stat="total"]')).toContainText('30');
    await expect(overview.getByTestId('supported-count')).toHaveText('8');
    await expect(overview.locator('dd')).toHaveText(['8', '8', '6', '8']);
    await expect(overview.locator('[data-stat="unknown"]')).toContainText('근거 미확인');
    await expect(overview.getByTestId('support-distribution').locator('svg')).toHaveCount(0);
  });
});
