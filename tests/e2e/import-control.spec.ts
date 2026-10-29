import { test, expect } from '@playwright/test';

test('stopping finishes the current row and reopening resumes the remaining rows', async ({
  page,
}, info) => {
  await page.goto('/en/admin/login');
  await page
    .getByRole('main')
    .getByLabel('Email', { exact: true })
    .fill(process.env.LOCAL_ADMIN_EMAIL!);
  await page
    .getByRole('main')
    .getByLabel('Password', { exact: true })
    .fill(process.env.LOCAL_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/apps$/);
  await page.goto('/en/admin/apps/import');
  await page
    .getByRole('main')
    .getByLabel('South Korea App Store URLs (one per line)', { exact: true })
    .fill(
      [1, 2]
        .map((i) => `https://apps.apple.com/kr/app/id9900047${info.repeatEachIndex}0${i}`)
        .join('\n'),
    );
  await page.getByRole('button', { name: 'Check input', exact: true }).click();
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
    await page.getByRole('button', { name: 'Start / resume import', exact: true }).click();
    await page.getByRole('button', { name: 'Stop after current row', exact: true }).click();
  } finally {
    release();
  }
  await expect(page.getByRole('status').filter({ hasText: /[12] of 2 processed/ })).toHaveText(
    '1 of 2 processed',
    { timeout: 15000 },
  );
  await expect(page.getByRole('main').getByTestId('import-row').first()).toContainText(
    'Draft created',
  );
  await expect(page.getByRole('main').getByTestId('import-row').nth(1)).toContainText('Pending');
  await page.unroute('**/en/admin/apps/import');
  await page.getByRole('link', { name: 'Reopen this import', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /[12] of 2 processed/ })).toHaveText(
    '1 of 2 processed',
  );
  await page.getByRole('button', { name: 'Start / resume import', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /[12] of 2 processed/ })).toHaveText(
    '2 of 2 processed',
    { timeout: 15000 },
  );
  await expect(page.getByRole('main').getByTestId('import-row').nth(1)).toContainText(
    'Draft created',
  );
});
