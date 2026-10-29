import en from '../../src/messages/en.json' with { type: 'json' };
import { fieldName } from './select-option';
import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import type { Client } from 'pg';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { connect, asActor } from '../integration/helpers.ts';
import { inspectIcon, localIconStorage } from '../../src/lib/icons/storage.ts';

test('stored icons render offline, require draft authorization and disappear after archival', async ({
  page,
  context,
}) => {
  const db = await connect();
  const actor = process.env.LOCAL_ADMIN_USER_ID!;
  const bytes = await sharp({
    create: { width: 48, height: 48, channels: 4, background: '#3b578d' },
  })
    .png()
    .toBuffer();
  const asset = await inspectIcon(bytes);
  await localIconStorage().put(asset.storage_path, bytes);
  let app: { id: string; revision: number };
  try {
    app = await asActor(db, actor, async (db: Client) => {
      const saved = (
        await db.query('SELECT app_private.save_app($1,NULL) AS app', [
          {
            app_store_id: '990008002',
            slug: 'fictional-stored-icon-browser',
            name: 'Fictional icon browser',
            developer: 'Test only',
            category: 'productivity',
            original_locale: 'en',
            status: 'unknown',
            investigation_reason: 'Test-only investigation',
            translations: {
              en: {
                name: 'Fictional icon browser',
                summary: 'Fictional icon test',
                state: 'current',
              },
            },
            evidence: [],
          },
        ])
      ).rows[0].app;
      await db.query(
        `INSERT INTO public.app_icon_assets(app_id,storage_path,sha256,content_type,byte_size,width,height,source_url,fetched_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,now())`,
        [
          saved.id,
          asset.storage_path,
          asset.sha256,
          asset.content_type,
          asset.byte_size,
          asset.width,
          asset.height,
          'https://is1-ssl.mzstatic.com/image/thumb/fictional/offline.png',
        ],
      );
      return saved;
    });
    expect((await context.request.get(`/api/app-icons/${app.id}`)).status()).toBe(404);
    expect((await context.request.get(`/api/admin/app-icons/${app.id}`)).status()).toBe(404);
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
    await expect(page).toHaveURL(/\/en\/admin\/apps$/);
    let external = 0;
    await context.route('https://**/*', (route) => {
      external++;
      return route.abort();
    });
    await page.goto(`/en/admin/apps/${app.id}`);
    const adminImage = page.getByRole('main').locator(`img[src$="/api/admin/app-icons/${app.id}"]`);
    await expect(adminImage).toBeVisible();
    await expect
      .poll(() => adminImage.evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBe(48);
    const response = await context.request.get(`/api/admin/app-icons/${app.id}`);
    expect(await response.body()).toEqual(bytes);
    expect(response.headers()['cache-control']).toContain('no-store');
    app = await asActor(
      db,
      actor,
      async (db: Client) =>
        (
          await db.query('SELECT app_private.publish_app($1,$2,$3) AS app', [
            app.id,
            app.revision,
            'Fictional test approval',
          ])
        ).rows[0].app,
    );
    for (const [locale, width] of [
      ['ko', 360],
      ['en', 1440],
    ] as const) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}/apps/fictional-stored-icon-browser`);
      const image = page.getByRole('main').locator(`img[src$="/api/app-icons/${app.id}"]`);
      await expect(image).toBeVisible();
      await expect
        .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBe(48);
      expect(await image.evaluate((img) => img.getBoundingClientRect().width)).toBe(48);
      await expect(
        page.getByRole('main').locator('a[href="https://apps.apple.com/kr/app/id990008002"] img'),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    expect(external).toBe(0);
    await page.goto('/en?q=Fictional%20icon%20browser');
    await expect
      .poll(() =>
        page
          .locator(`img[src$="/api/app-icons/${app.id}"]`)
          .evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBe(48);
    await page.getByTestId('app-card').click();
    await expect(page).toHaveURL(/apps\/fictional-stored-icon-browser/);
    await asActor(db, actor, (db: Client) =>
      db.query('SELECT app_private.archive_app($1,$2,$3)', [
        app.id,
        app.revision,
        'Fictional archive',
      ]),
    );
    expect((await context.request.get(`/api/app-icons/${app.id}`)).status()).toBe(404);
    await page.goto(`/en/admin/apps/${app.id}`);
    // A missing file falls back to the generic icon rather than leaking a remote URL.
    await unlink(
      resolve(process.env.APP_ICON_STORAGE_DIR || '.data/app-icons', asset.storage_path),
    );
    await page.reload();
    await expect(
      page.getByRole('main').locator(`img[src$="/api/admin/app-icons/${app.id}"]`),
    ).toHaveCount(0);
    await page.getByRole('button', { name: en.Admin.logout, exact: true }).click();
    await expect(page).toHaveURL(/\/en\/admin\/login$/);
    expect((await context.request.get(`/api/admin/app-icons/${app.id}`)).status()).toBe(404);
  } finally {
    await db.end();
  }
});
