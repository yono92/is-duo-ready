import { expect, type Page } from '@playwright/test';

export async function waitForDevice(page: Page) {
  // Next can temporarily retain a hidden Activity tree after navigation.
  const model = page.locator('[data-testid="device-model"]:visible');
  await expect(model).toHaveCount(1, { timeout: 30000 });
  await expect(model).toHaveAttribute('data-status', /^(ready|unavailable)$/, {
    timeout: 30000,
  });
}
