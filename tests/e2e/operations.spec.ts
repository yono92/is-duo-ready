import { test, expect, type Page } from '@playwright/test';
import type { Client } from 'pg';
import AxeBuilder from '@axe-core/playwright';
import ko from '../../src/messages/ko.json' with { type: 'json' };
import en from '../../src/messages/en.json' with { type: 'json' };
import { connect, asActor } from '../integration/helpers.mjs';

async function login(page: Page, locale: 'ko' | 'en') {
  const t = (locale === 'ko' ? ko : en).Admin;
  await page.goto(`/${locale}/admin/login`);
  await page
    .getByRole('main')
    .getByLabel(t.email, { exact: true })
    .fill(process.env.LOCAL_ADMIN_EMAIL!);
  await page
    .getByRole('main')
    .getByLabel(t.password, { exact: true })
    .fill(process.env.LOCAL_ADMIN_PASSWORD!);
  await page.getByRole('main').getByLabel(t.password, { exact: true }).press('Enter');
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/apps$`));
}
async function seed(id: string) {
  const db = await connect();
  try {
    return await asActor(db, process.env.LOCAL_ADMIN_USER_ID, async (db: Client) => {
      const app = (
        await db.query('SELECT app_private.save_app($1,NULL) AS app', [
          {
            app_store_id: id,
            slug: 'operations-' + id,
            name: 'Fictional operations ' + id,
            developer: 'Test only developer',
            category: 'productivity',
            aliases: [],
            original_locale: 'en',
            status: 'unknown',
            investigation_reason: 'Fictional test investigation',
            current_version: '0.9',
            translations: {
              en: {
                name: 'Fictional operations ' + id,
                summary: 'Fictional test summary',
                state: 'current',
              },
            },
            evidence: [],
          },
        ])
      ).rows[0].app;
      await db.query('SELECT app_private.publish_app($1,$2,$3)', [
        app.id,
        app.revision,
        'Fictional initial review',
      ]);
      return app as { id: string; slug: string };
    });
  } finally {
    await db.end();
  }
}
async function widths(page: Page) {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
}
for (const [li, locale] of (['ko', 'en'] as const).entries())
  for (const [ti, theme] of (['light', 'dark'] as const).entries()) {
    test(`operations collection, comparison, approval and anonymous report ${locale} ${theme}`, async ({
      page,
    }, info) => {
      const m = locale === 'ko' ? ko : en;
      const t = m.Operations;
      const s = m.Submission;
      const a = m.Admin;
      const id = `99000450${li}${ti}${info.repeatEachIndex}1`;
      const app = await seed(id);
      const storeUrl = `https://apps.apple.com/kr/app/id${id}`;
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(`/${locale}/submit?app=${app.slug}`);
      await expect(page.getByRole('main').getByLabel(s.storeUrl, { exact: true })).toHaveValue(
        storeUrl,
      );
      await expect(page.getByRole('combobox', { name: s.kind, exact: true })).toHaveValue(
        'correction',
      );
      await widths(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page
        .getByRole('main')
        .getByLabel(s.body, { exact: true })
        .fill(`Fictional private report ${id} <script>window.bad=1</script>`);
      await page
        .getByRole('main')
        .getByLabel(s.evidenceUrl, { exact: true })
        .fill(`https://example.com/fictional-${id}`);
      await page.getByRole('button', { name: s.send, exact: true }).press('Enter');
      await expect(page.getByRole('heading', { name: s.received, exact: true })).toBeVisible();
      const db = await connect();
      try {
        const before = (
          await db.query('SELECT snapshot FROM public.directory_entries WHERE app_id=$1', [app.id])
        ).rows[0].snapshot;
        await login(page, locale);
        await page.getByRole('link', { name: t.collections, exact: true }).click();
        await page.getByRole('main').getByText(t.addTarget, { exact: true }).first().click();
        await page.getByRole('combobox', { name: t.app, exact: true }).selectOption(app.id);
        await page.getByRole('main').getByLabel(t.sourceUrl, { exact: true }).fill(storeUrl);
        await page
          .getByRole('main')
          .getByLabel(t.approvalNote, { exact: true })
          .fill('Fictional test target; isolated API fixture only');
        await page.getByRole('main').getByLabel(t.targetConfirm, { exact: true }).check();
        await page.getByRole('button', { name: t.addTarget, exact: true }).click();
        const target = page.getByRole('listitem').filter({
          has: page.getByRole('link', { name: 'Fictional operations ' + id, exact: true }),
        });
        await expect(target).toBeVisible();
        await target.getByRole('button', { name: t.runNow, exact: true }).click();
        await expect(
          target.getByRole('status').filter({ hasText: t.results.succeeded }),
        ).toHaveText(t.results.succeeded, {
          timeout: 30000,
        });
        await widths(page);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        const review = (
          await db.query(
            'SELECT id FROM app_private.review_items WHERE app_id=$1 AND observation_id IS NOT NULL',
            [app.id],
          )
        ).rows[0];
        expect(
          (
            await db.query('SELECT snapshot FROM public.directory_entries WHERE app_id=$1', [
              app.id,
            ])
          ).rows[0].snapshot,
        ).toEqual(before);
        await target.getByRole('button', { name: t.runNow, exact: true }).click();
        await expect(target.getByRole('button', { name: t.runNow, exact: true })).toBeEnabled();
        expect(
          (
            await db.query(
              'SELECT count(*)::int n FROM app_private.review_items WHERE app_id=$1 AND observation_id IS NOT NULL',
              [app.id],
            )
          ).rows[0].n,
        ).toBe(1);
        await page.getByRole('link', { name: t.reviews, exact: true }).click();
        await page
          .getByRole('main')
          .locator(`a[href="/${locale}/admin/reviews/${review.id}"]`)
          .click();
        await expect(page.getByRole('heading', { name: t.published, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: t.candidate, exact: true })).toBeVisible();
        await widths(page);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.screenshot({
          path: info.outputPath(`review-${locale}-${theme}.png`),
          fullPage: true,
        });
        await page
          .getByRole('main')
          .getByLabel(t.reason, { exact: true })
          .fill('Fictional private deferred reason');
        await page.getByRole('button', { name: t.saveDecision, exact: true }).click();
        await expect(
          page.getByRole('main').getByText(t.states.deferred, { exact: false }).first(),
        ).toBeVisible();
        expect(
          (await db.query('SELECT state FROM app_private.review_items WHERE id=$1', [review.id]))
            .rows[0].state,
        ).toBe('deferred');
        await page.getByRole('link', { name: t.editDraft, exact: true }).click();
        await page
          .getByRole('combobox', { name: a.fields.status, exact: true })
          .selectOption('supported');
        await page
          .getByRole('main')
          .getByLabel(a.fields.current_version, { exact: true })
          .fill('1.0');
        await page.getByRole('button', { name: a.addEvidence, exact: true }).click();
        await page
          .getByRole('main')
          .getByLabel(a.fields.title, { exact: true })
          .fill('Fictional verified operations source');
        await page
          .getByRole('main')
          .getByLabel(a.fields.url, { exact: true })
          .fill(`https://example.com/official-test-${id}`);
        await page
          .getByRole('main')
          .getByLabel(a.fields.quote, { exact: true })
          .fill('Fictional official evidence in temporary database only');
        await page.getByRole('main').getByLabel(a.officialConfirmation, { exact: true }).check();
        await page.getByRole('button', { name: a.saveDraft, exact: true }).click();
        await expect(page).toHaveURL(/saved=1/);
        await page.goto(`/${locale}/admin/reviews/${review.id}`);
        await page
          .getByRole('combobox', { name: t.decision, exact: true })
          .selectOption('approved');
        await page
          .getByRole('main')
          .getByLabel(t.reason, { exact: true })
          .fill('Fictional approved change');
        await page.getByRole('main').getByLabel(t.approveConfirm, { exact: true }).focus();
        await page.getByRole('main').getByLabel(t.approveConfirm, { exact: true }).press('Space');
        await page.getByRole('button', { name: t.saveDecision, exact: true }).press('Enter');
        await expect(
          page
            .getByRole('main')
            .getByText('Fictional operations ' + id + ' · ' + t.states.approved, { exact: true }),
        ).toBeVisible();
        expect(
          (await db.query('SELECT state FROM app_private.review_items WHERE id=$1', [review.id]))
            .rows[0].state,
        ).toBe('approved');
        await page.goto(`/${locale}/apps/${app.slug}`);
        await expect(
          page.getByRole('link', { name: 'Fictional verified operations source', exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole('main').getByText('Fictional private deferred reason', { exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByRole('main').getByText(`Fictional private report ${id}`, { exact: false }),
        ).toHaveCount(0);
        await page.goto(`/${locale}/admin/submissions`);
        const submission = (
          await db.query(
            'SELECT id FROM app_private.review_items WHERE app_id=$1 AND submission_id IS NOT NULL',
            [app.id],
          )
        ).rows[0];
        await page
          .getByRole('main')
          .locator(`a[href="/${locale}/admin/reviews/${submission.id}"]`)
          .click();
        await expect(
          page
            .getByRole('main')
            .getByText(`Fictional private report ${id} <script>window.bad=1</script>`, {
              exact: true,
            }),
        ).toBeVisible();
        await page
          .getByRole('combobox', { name: t.decision, exact: true })
          .selectOption('rejected');
        await page
          .getByRole('main')
          .getByLabel(t.reason, { exact: true })
          .fill('Fictional duplicate report');
        await page.getByRole('button', { name: t.saveDecision, exact: true }).click();
        await expect(
          page
            .getByRole('main')
            .getByText('Fictional operations ' + id + ' · ' + t.states.rejected, { exact: true }),
        ).toBeVisible();
        expect(await page.evaluate(() => 'bad' in window)).toBe(false);
        expect(errors).toEqual([]);
      } finally {
        await db.end();
      }
    });
  }

test('new submission links only after app creation, and denied actions cannot mutate it', async ({
  page,
  browser,
}, info) => {
  const id = `990004590${info.repeatEachIndex}1`;
  const t = en.Operations;
  const s = en.Submission;
  await page.goto('/en/submit');
  await page
    .getByRole('main')
    .getByLabel(s.storeUrl, { exact: true })
    .fill(`https://apps.apple.com/kr/app/id${id}`);
  await page
    .getByRole('main')
    .getByLabel(s.body, { exact: true })
    .fill(`Fictional new app report ${id}`);
  await page
    .getByRole('main')
    .getByLabel(s.evidenceUrl, { exact: true })
    .fill('https://example.com/new-app-test');
  await page.getByRole('button', { name: s.send, exact: true }).click();
  await expect(page.getByRole('heading', { name: s.received, exact: true })).toBeVisible();
  await login(page, 'en');
  const db = await connect();
  try {
    const item = (
      await db.query(
        'SELECT r.id,r.app_id FROM app_private.review_items r JOIN app_private.submissions s ON s.id=r.submission_id WHERE s.app_store_id=$1',
        [id],
      )
    ).rows[0];
    expect(item.app_id).toBeNull();
    await page.goto(`/en/admin/reviews/${item.id}`);
    await expect(page.getByRole('main').getByText(t.importFirst, { exact: true })).toBeVisible();
    await seed(id);
    await page.reload();
    await page.getByRole('button', { name: t.linkApp, exact: true }).click();
    await expect(page.getByRole('link', { name: t.editDraft, exact: true })).toBeVisible();
    const requestPromise = page.waitForRequest(
      (request) => request.method() === 'POST' && !!request.headers()['next-action'],
    );
    await page
      .getByRole('main')
      .getByLabel(t.reason, { exact: true })
      .fill('Fictional deferred report');
    await page.getByRole('button', { name: t.saveDecision, exact: true }).click();
    const request = await requestPromise;
    await expect(
      page.getByRole('main').getByText('Fictional deferred report', { exact: true }),
    ).toBeVisible();
    const before = (
      await db.query('SELECT revision FROM app_private.review_items WHERE id=$1', [item.id])
    ).rows[0].revision;
    const anonymous = await browser.newContext();
    try {
      const response = await anonymous.request.post(request.url(), {
        headers: {
          'next-action': request.headers()['next-action'],
          'content-type': request.headers()['content-type'],
          origin: new URL(request.url()).origin,
        },
        data: request.postDataBuffer()!,
      });
      expect(await response.text()).toContain('authRequired');
      const anonPage = await anonymous.newPage();
      for (const route of ['collections', 'reviews', 'submissions']) {
        await anonPage.goto('/en/admin/' + route);
        await expect(anonPage).toHaveURL(/\/admin\/login/);
      }
    } finally {
      await anonymous.close();
    }
    expect(
      (await db.query('SELECT revision FROM app_private.review_items WHERE id=$1', [item.id]))
        .rows[0].revision,
    ).toBe(before);
    // Revoke allowlist after the form was rendered; the server action must re-check it.
    await db.query('UPDATE app_private.admin_users SET enabled=false WHERE user_id=$1', [
      process.env.LOCAL_ADMIN_USER_ID,
    ]);
    try {
      const response = await page.request.post(request.url(), {
        headers: {
          'next-action': request.headers()['next-action'],
          'content-type': request.headers()['content-type'],
          origin: new URL(request.url()).origin,
        },
        data: request.postDataBuffer()!,
      });
      expect(await response.text()).toContain('forbidden');
    } finally {
      await db.query('UPDATE app_private.admin_users SET enabled=true WHERE user_id=$1', [
        process.env.LOCAL_ADMIN_USER_ID,
      ]);
    }
    expect(
      (await db.query('SELECT revision FROM app_private.review_items WHERE id=$1', [item.id]))
        .rows[0].revision,
    ).toBe(before);
  } finally {
    await db.end();
  }
});
