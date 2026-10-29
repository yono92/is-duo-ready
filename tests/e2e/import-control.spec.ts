import en from '../../src/messages/en.json' with { type: 'json' };
import { fieldName } from './select-option';
import { test, expect } from '@playwright/test';

test('stopping finishes the current row and reopening resumes the remaining rows', async ({
  page,
}, info) => {
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
  await page.goto('/en/admin/apps/import');
  await page
    .getByRole('main')
    .getByLabel(fieldName(en.Import.urlInput), { exact: true })
    .fill(
      [1, 2]
        .map((i) => `https://apps.apple.com/kr/app/id9900047${info.repeatEachIndex}0${i}`)
        .join('\n'),
    );
  await page.getByRole('button', { name: en.Import.preview, exact: true }).click();
  await expect(page.getByRole('main').getByTestId('import-row')).toHaveCount(2);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/en/admin/apps/import', async (route) => {
    if (route.request().method() === 'POST') await gate;
    await route.continue();
  });
  try {
    await page.getByRole('button', { name: en.Import.start, exact: true }).click();
    await page.getByRole('button', { name: en.Import.stop, exact: true }).click();
  } finally {
    release();
  }
  await expect(page.getByRole('status').filter({ hasText: /[12] of 2 processed/ })).toHaveText(
    '1 of 2 processed',
    { timeout: 15000 },
  );
  await expect(page.getByRole('main').getByTestId('import-row').first()).toContainText(
    en.Import.states.created,
  );
  await expect(page.getByRole('main').getByTestId('import-row').nth(1)).toContainText(
    en.Import.states.pending,
  );
  await page.unroute('**/en/admin/apps/import');
  await page.getByRole('link', { name: en.Import.resumeLink, exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /[12] of 2 processed/ })).toHaveText(
    '1 of 2 processed',
  );
  await page.getByRole('button', { name: en.Import.start, exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /[12] of 2 processed/ })).toHaveText(
    '2 of 2 processed',
    { timeout: 15000 },
  );
  await expect(page.getByRole('main').getByTestId('import-row').nth(1)).toContainText(
    en.Import.states.created,
  );
  await expect(page.getByText(en.Import.completedHelp, { exact: true })).toBeVisible();
  await expect(page.getByText(en.Import.resumeHelp, { exact: true })).not.toBeVisible();
});
