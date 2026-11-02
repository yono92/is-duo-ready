import { expect, test } from '@playwright/test';
import { waitForDevice } from './wait-for-device';

for (const locale of ['ko', 'en']) {
  test(`${locale} fixture browsing makes no advertising requests`, async ({ page }) => {
    const advertising = /https:\/\/[^/]*(?:googlesyndication|doubleclick|fundingchoices)\./;
    const requests: string[] = [];
    page.on('request', (request) => {
      if (advertising.test(request.url())) requests.push(request.url());
    });
    // A regression must fail the test without sending real ad traffic.
    await page.route(advertising, (route) => route.abort());

    await page.goto(`/${locale}`);
    await waitForDevice(page);
    await expect(page.getByTestId('app-card')).toHaveCount(24);
    await expect(page.locator('.directory-ad-space, ins.adsbygoogle, [data-ad-slot]')).toHaveCount(
      0,
    );
    await page.getByTestId('app-card').first().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/apps/`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto(`/${locale}/updates`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('switch')).toBeEnabled();
    await expect(page.locator('script[src*="adsbygoogle"], ins.adsbygoogle')).toHaveCount(0);
    expect(requests).toEqual([]);
  });
}
