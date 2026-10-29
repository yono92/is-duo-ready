import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import { connect } from '../integration/helpers.mjs';

async function login(page: Page, locale: 'ko' | 'en') {
  const t = (locale === 'ko' ? ko : en).Admin;
  await page.goto(`/${locale}/admin/login`);
  await page.getByLabel(t.email, { exact: true }).fill(process.env.LOCAL_ADMIN_EMAIL!);
  await page.getByLabel(t.email, { exact: true }).press('Tab');
  await expect(page.getByLabel(t.password, { exact: true })).toBeFocused();
  await page.getByLabel(t.password, { exact: true }).fill(process.env.LOCAL_ADMIN_PASSWORD!);
  await page.getByLabel(t.password, { exact: true }).press('Enter');
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/apps$`));
  await page.getByRole('link', { name: t.importApps, exact: true }).click();
}

for (const [index, locale] of (['ko', 'en'] as const).entries()) {
  for (const [themeIndex, theme] of (['light', 'dark'] as const).entries())
    for (const width of [360, 768, 1440])
      test(`import CSV, replay, explicitly review and publish ${locale} ${theme} ${width}`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ colorScheme: theme });
        const messages = locale === 'ko' ? ko : en;
        const t = messages.Import,
          a = messages.Admin;
        const id = `990004${index}${themeIndex}${width}${info.repeatEachIndex}1`;
        const source = `https://example.com/fictional-import-${id}`;
        const csv = `app_store_url,source_url,proposed_status,evidence_summary,announced_at,support_version\nhttps://apps.apple.com/kr/app/id${id},${source},supported,Fictional unverified proposal,,1.0\ninvalid,,,,,`;
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await login(page, locale);
        for (const result of [t.states.created, t.states.duplicate]) {
          await page.getByRole('combobox', { name: t.mode, exact: true }).selectOption('csv');
          await page.getByLabel(t.file, { exact: true }).setInputFiles({
            name: 'fictional.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csv),
          });
          await page.getByRole('button', { name: t.preview, exact: true }).click();
          await expect(page.getByTestId('import-row')).toHaveCount(2);
          await expect(page.getByTestId('import-row').nth(1)).toContainText(t.errors.invalidUrl);
          await page.getByRole('button', { name: t.start, exact: true }).click();
          await expect(page.getByTestId('import-row').first()).toContainText(result, {
            timeout: 20000,
          });
          if (result === t.states.created) await page.goto(`/${locale}/admin/apps/import`);
        }
        await page.getByRole('link', { name: t.edit, exact: true }).click();
        await expect(page.getByRole('heading', { name: t.proposals, exact: true })).toBeVisible();
        await expect(
          page.getByRole('combobox', { name: a.fields.status, exact: true }),
        ).toHaveValue('unknown');
        await expect(page.getByText(a.publication.draft, { exact: true })).toBeVisible();
        await page
          .getByRole('combobox', { name: a.fields.original_locale, exact: true })
          .selectOption(locale);
        const translation = page
          .getByRole('heading', { name: a.languages[locale], exact: true })
          .locator('..');
        await translation
          .getByLabel(a.fields.translatedName, { exact: true })
          .fill(`Fictional import ${id}`);
        await translation
          .getByLabel(a.fields.summary, { exact: true })
          .fill('Fictional test support summary');
        await page
          .getByRole('combobox', { name: a.fields.status, exact: true })
          .selectOption('supported');
        await page.getByLabel(a.fields.support_version, { exact: true }).fill('1.0');
        await page.getByRole('button', { name: a.addEvidence, exact: true }).click();
        await page.getByLabel(a.fields.title, { exact: true }).fill('Fictional verified source');
        await page.getByLabel(a.fields.url, { exact: true }).fill(source);
        await page
          .getByLabel(a.fields.quote, { exact: true })
          .fill('Fictional evidence for isolated browser testing only');
        await page.getByRole('checkbox', { name: a.officialConfirmation, exact: true }).check();
        await page.getByRole('button', { name: a.saveDraft, exact: true }).click();
        await expect(page).toHaveURL(/saved=1/);
        await page
          .getByLabel(a.fields.changeReason, { exact: true })
          .fill('Fictional imported app review');
        await page.getByRole('checkbox', { name: a.reviewConfirmation, exact: true }).focus();
        await page
          .getByRole('checkbox', { name: a.reviewConfirmation, exact: true })
          .press('Space');
        await page.getByRole('button', { name: a.applyReview, exact: true }).press('Enter');
        await expect(page).toHaveURL(/reviewed=1/);
        await page.goto(`/${locale}?q=${id}`);
        await expect(page.getByTestId('app-card')).toHaveCount(1);
        await page.getByTestId('app-card').click();
        await expect(
          page.getByRole('link', { name: 'Fictional verified source', exact: true }),
        ).toHaveAttribute('href', source);
        await expect(page.getByText('Fictional unverified proposal', { exact: true })).toHaveCount(
          0,
        );
        expect(errors).toEqual([]);
      });
  for (const theme of ['light', 'dark'] as const)
    test(`import accessibility ${locale} ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await login(page, locale);
      for (const width of [360, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          )
          .toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
            .violations,
        ).toEqual([]);
        if (width === 360 || width === 1440)
          await page.screenshot({
            path: `test-results/import-${locale}-${theme}-${width}.png`,
            fullPage: true,
          });
      }
    });
}

test('failed external lookup is recorded, resumable and retryable without repeating successful rows', async ({
  page,
}, info) => {
  const id = `9900049${info.repeatEachIndex}99`;
  await login(page, 'en');
  await page
    .getByLabel(en.Import.urlInput, { exact: true })
    .fill(`https://apps.apple.com/kr/app/id${id}`);
  await page.getByRole('button', { name: en.Import.preview, exact: true }).click();
  await page.getByRole('button', { name: en.Import.start, exact: true }).click();
  await expect(page.getByTestId('import-row')).toContainText(en.Import.errors.upstream, {
    timeout: 25000,
  });
  await page.getByRole('link', { name: en.Import.resumeLink, exact: true }).click();
  await expect(page.getByTestId('import-row')).toContainText(en.Import.errors.upstream);
  await page.getByRole('button', { name: en.Import.retry, exact: true }).click();
  await expect(page.getByTestId('import-row')).toContainText(en.Import.states.created, {
    timeout: 15000,
  });
  const db = await connect();
  try {
    expect(
      (
        await db.query('SELECT count(*)::int AS n FROM app_private.apps WHERE app_store_id=$1', [
          id,
        ])
      ).rows[0].n,
    ).toBe(1);
  } finally {
    await db.end();
  }
});
