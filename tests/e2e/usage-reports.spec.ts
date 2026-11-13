import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import { asActor, connect } from '../integration/helpers.ts';
import { fieldName, selectOption } from './select-option';

async function login(page: Page, locale: 'ko' | 'en') {
  const t = (locale === 'ko' ? ko : en).Admin;
  await page.goto(`/${locale}/admin/login`);
  await page.getByLabel(fieldName(t.email), { exact: true }).fill(process.env.LOCAL_ADMIN_EMAIL!);
  await page
    .getByLabel(fieldName(t.password), { exact: true })
    .fill(process.env.LOCAL_ADMIN_PASSWORD!);
  await page.getByLabel(fieldName(t.password), { exact: true }).press('Enter');
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/apps$`));
}

async function widths(page: Page) {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
  }
}

async function officialFingerprint(db: import('pg').Client, appId: string) {
  return (
    await db.query(
      `SELECT encode(sha256(convert_to(jsonb_build_object('entry',to_jsonb(d),
    'history',(SELECT jsonb_agg(to_jsonb(h) ORDER BY h.id) FROM public.support_history h WHERE h.app_id=d.app_id))::text,'UTF8')),'hex') AS hash
    FROM public.directory_entries d WHERE d.app_id=$1`,
      [appId],
    )
  ).rows[0].hash;
}

for (const [li, locale] of (['ko', 'en'] as const).entries())
  for (const [ti, theme] of (['light', 'dark'] as const).entries()) {
    test(`reviewed usage report and image lifecycle ${locale} ${theme}`, async ({
      page,
      browser,
    }, info) => {
      const m = locale === 'ko' ? ko : en;
      const s = m.Submission;
      const u = m.Usage;
      const o = m.Operations;
      const id = `9900096${li}${ti}${info.repeatEachIndex}1`;
      const name = `Fictional usage app ${id}`;
      const body = `Fictional user experience ${id}: text clips during folding. <script>window.usageInjected=true</script>`;
      const db = await connect();
      const publicContext = await browser.newContext({ colorScheme: theme });
      try {
        const app = await asActor(db, process.env.LOCAL_ADMIN_USER_ID!, async (connection) => {
          const saved = (
            await connection.query('SELECT app_private.save_app($1,NULL) AS app', [
              {
                app_store_id: id,
                slug: `usage-${id}`,
                name,
                developer: 'Test only developer',
                category: 'productivity',
                aliases: [],
                original_locale: locale,
                status: 'unknown',
                investigation_reason: 'Fictional research: no official support statement',
                current_version: '1.0',
                translations: {
                  [locale]: { name, summary: 'Fictional test summary', state: 'current' },
                },
                evidence: [],
              },
            ])
          ).rows[0].app;
          await connection.query('SELECT app_private.publish_app($1,$2,$3)', [
            saved.id,
            saved.revision,
            'Fictional initial review',
          ]);
          return saved as { id: string; slug: string };
        });
        const before = await officialFingerprint(db, app.id);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(`/${locale}/submit?app=${app.slug}&kind=usage`);
        await expect(
          page.getByRole('combobox', { name: fieldName(s.kind), exact: true }),
        ).toContainText(s.usage);
        await expect(page.getByLabel(fieldName(s.storeUrl), { exact: true })).toHaveValue(
          `https://apps.apple.com/kr/app/id${id}`,
        );
        const environment = locale === 'en' ? 'simulator' : 'device';
        if (environment === 'simulator')
          await selectOption(
            page,
            page.getByRole('combobox', { name: fieldName(u.environment), exact: true }),
            u.environments.simulator,
          );
        await page
          .getByLabel(fieldName(u.deviceModel), { exact: true })
          .fill(environment === 'device' ? 'iPhone Duo' : 'iPhone Duo Simulator');
        await page.getByLabel(fieldName(u.osVersion), { exact: true }).fill('27.1');
        await page.getByLabel(fieldName(u.appVersion), { exact: true }).fill('1.0');
        await page.getByLabel(fieldName(u.observedOn), { exact: true }).fill('2026-01-01');
        await selectOption(
          page,
          page.getByRole('combobox', { name: fieldName(u.displayMode), exact: true }),
          u.displayModes.transition,
        );
        await selectOption(
          page,
          page.getByRole('combobox', { name: fieldName(u.result), exact: true }),
          u.results.issues,
        );
        await page.getByLabel(fieldName(s.body), { exact: true }).fill(body);
        await expect(
          page.getByLabel(fieldName(s.optionalEvidenceUrl), { exact: true }),
        ).toBeEmpty();
        const png = await sharp({
          create: { width: 400, height: 300, channels: 3, background: '#396ad6' },
        })
          .png()
          .toBuffer();
        // Native file inputs have no interactive role; Astryx owns the visible label and chooser.
        await page
          .locator('input[type="file"]')
          .setInputFiles({ name: 'fictional-usage.png', mimeType: 'image/png', buffer: png });
        const consent = page.getByRole('checkbox', { name: fieldName(u.consent), exact: true });
        await expect(consent).not.toBeChecked();
        await page.getByRole('button', { name: s.send, exact: true }).click();
        await expect(page.getByRole('heading', { name: s.received, exact: true })).toHaveCount(0);
        expect(
          (await db.query('SELECT * FROM app_private.submissions WHERE app_store_id=$1', [id]))
            .rowCount,
        ).toBe(0);
        await consent.check();
        await widths(page);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.screenshot({
          path: info.outputPath(`usage-form-${locale}-${theme}.png`),
          fullPage: true,
        });
        await page.getByRole('button', { name: s.send, exact: true }).press('Enter');
        await expect(page.getByRole('heading', { name: s.received, exact: true })).toBeVisible();
        const item = (
          await db.query(
            'SELECT * FROM app_private.review_items WHERE app_id=$1 AND submission_id IS NOT NULL',
            [app.id],
          )
        ).rows[0];
        expect(item.candidate_payload.usage.environment).toBe(environment);
        expect(item.candidate_payload.has_screenshot).toBe(true);
        const imagePath = `/api/usage-screenshots/${item.submission_id}`;
        const privateImagePath = `/api/admin/usage-screenshots/${item.submission_id}`;
        expect((await publicContext.request.get(imagePath)).status()).toBe(404);
        expect((await publicContext.request.get(privateImagePath)).status()).toBe(404);
        const publicPage = await publicContext.newPage();
        await publicPage.goto(`/${locale}/apps/${app.slug}`);
        await expect(publicPage.getByRole('main').getByText(body, { exact: true })).toHaveCount(0);
        await expect(
          publicPage.getByRole('main').getByText(u.empty, { exact: true }),
        ).toBeVisible();
        expect(await officialFingerprint(db, app.id)).toBe(before);

        await login(page, locale);
        await page.goto(`/${locale}/admin/reviews/${item.id}`);
        const reviewMain = page.getByRole('main');
        await expect(reviewMain.getByText(body, { exact: true })).toBeVisible();
        await expect(
          reviewMain.getByText(u.environments[environment], { exact: true }),
        ).toBeVisible();
        await expect(
          reviewMain.getByRole('img', { name: u.screenshotAlt, exact: true }),
        ).toBeVisible();
        const privateImageLink = reviewMain.getByRole('link').filter({
          has: page.getByRole('img', { name: u.screenshotAlt, exact: true }),
        });
        await expect(privateImageLink).toHaveAttribute('href', privateImagePath);
        const privateImage = await page.request.get((await privateImageLink.getAttribute('href'))!);
        expect(privateImage.status()).toBe(200);
        expect(privateImage.headers()['content-type']).toContain('image/webp');
        expect(privateImage.headers()['cache-control']).toContain('no-store');
        await widths(page);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await selectOption(
          page,
          page.getByRole('combobox', { name: fieldName(o.decision), exact: true }),
          u.approve,
        );
        await page
          .getByLabel(fieldName(o.reason), { exact: true })
          .fill('Private moderator note: checked consent, screenshot and setup.');
        await page
          .getByRole('checkbox', { name: fieldName(u.approveConfirm), exact: true })
          .check();
        await page.getByRole('button', { name: o.saveDecision, exact: true }).click();
        await expect(
          page.getByRole('main').getByText(`${name} · ${o.states.approved}`, { exact: true }),
        ).toBeVisible();
        await publicPage.reload();
        await expect(publicPage.getByRole('main').getByText(body, { exact: true })).toBeVisible();
        await expect(
          publicPage.getByRole('main').getByText(u.environments[environment], { exact: true }),
        ).toBeVisible();
        await expect(
          publicPage.getByRole('main').getByRole('img', { name: u.screenshotAlt, exact: true }),
        ).toBeVisible();
        const publicImageLink = publicPage
          .getByRole('main')
          .getByRole('link')
          .filter({
            has: publicPage.getByRole('img', { name: u.screenshotAlt, exact: true }),
          });
        await expect(publicImageLink).toHaveAttribute('href', imagePath);
        await expect(
          publicPage.getByRole('main').getByText('Private moderator note:', { exact: false }),
        ).toHaveCount(0);
        expect(await publicPage.evaluate(() => 'usageInjected' in window)).toBe(false);
        expect(await officialFingerprint(db, app.id)).toBe(before);
        const publishedImage = await publicContext.request.get(
          (await publicImageLink.getAttribute('href'))!,
        );
        expect(publishedImage.status()).toBe(200);
        expect(publishedImage.headers()['content-type']).toContain('image/webp');
        expect(publishedImage.headers()['cache-control']).toContain('no-store');
        expect(await publishedImage.body()).toEqual(await privateImage.body());
        await widths(publicPage);
        expect((await new AxeBuilder({ page: publicPage }).analyze()).violations).toEqual([]);
        await publicPage.screenshot({
          path: info.outputPath(`usage-public-${locale}-${theme}.png`),
          fullPage: true,
        });
        const otherLocale = locale === 'ko' ? 'en' : 'ko';
        const other = otherLocale === 'ko' ? ko : en;
        await publicPage.goto(`/${otherLocale}/apps/${app.slug}`);
        await expect(publicPage.getByRole('main').getByText(body, { exact: true })).toHaveAttribute(
          'lang',
          locale,
        );
        await expect(
          publicPage.getByRole('main').getByText(other.Usage.originalLanguage, { exact: true }),
        ).toBeVisible();

        await page
          .getByLabel(fieldName(u.withdrawReason), { exact: true })
          .fill('Private withdrawal: reporter requested removal.');
        await page.getByRole('button', { name: u.withdraw, exact: true }).click();
        await expect(
          page.getByRole('main').getByText(`${name} · ${o.states.rejected}`, { exact: true }),
        ).toBeVisible();
        await publicPage.reload();
        await expect(publicPage.getByRole('main').getByText(body, { exact: true })).toHaveCount(0);
        await expect(
          publicPage
            .getByRole('main')
            .getByRole('img', { name: other.Usage.screenshotAlt, exact: true }),
        ).toHaveCount(0);
        expect((await publicContext.request.get(imagePath)).status()).toBe(404);
        expect((await page.request.get(privateImagePath)).status()).toBe(200);
        expect(await officialFingerprint(db, app.id)).toBe(before);
      } finally {
        await publicContext.close();
        await db.end();
      }
    });
  }
