import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { connect, asActor } from '../tests/integration/helpers.mjs';

const client = await connect(); // Strict temporary DB and loopback guard.
const actor = randomUUID();
let server;
try {
  await client.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
  await asActor(client, actor, async (db) => {
    for (const [index, state] of ['published', 'draft', 'archived'].entries()) {
      const app = (
        await db.query('SELECT app_private.save_app($1,NULL) AS app', [
          {
            app_store_id: `990003889${index}`,
            slug: `fictional-production-${state}`,
            name: `Fictional production ${state}`,
            developer: 'Test only',
            category: 'productivity',
            original_locale: 'en',
            status: 'unknown',
            investigation_reason: 'Fictional production verification',
            translations: {
              en: {
                name: `Fictional production ${state}`,
                summary: 'Fictional test only',
                state: 'current',
              },
            },
            evidence: [],
          },
        ])
      ).rows[0].app;
      if (state !== 'draft') {
        const published = (
          await db.query('SELECT app_private.publish_app($1,$2,$3,$4) AS app', [
            app.id,
            app.revision,
            `Fictional ${state} review`,
            'PRIVATE_PRODUCTION_NOTE',
          ])
        ).rows[0].app;
        if (state === 'archived')
          await db.query('SELECT app_private.archive_app($1,$2,$3)', [
            app.id,
            published.revision,
            'Test archive',
          ]);
      }
    }
  });
  server = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3352'],
    {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DUO_TEST_RUN: '',
        DATABASE_URL: process.env.DUO_TEST_DATABASE_URL,
        DIRECTORY_DATA_SOURCE: 'postgres',
        VERCEL: '1',
        VERCEL_ENV: 'production',
        PUBLIC_INDEXING: 'true',
        NEXT_PUBLIC_SITE_URL: 'https://example.com',
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      },
      stdio: 'ignore',
    },
  );
  const base = 'http://127.0.0.1:3352';
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error('Production test server exited');
    try {
      if ((await fetch(`${base}/en`)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* starting */
    }
    await delay(100);
  }
  assert.ok(ready, 'Production DB test server did not start');
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  for (const locale of ['ko', 'en']) {
    assert.ok(sitemap.includes(`/${locale}/apps/fictional-production-published`));
    const home = await (await fetch(`${base}/${locale}`)).text();
    assert.equal((home.match(/data-testid="app-card"/g) ?? []).length, 1);
    assert.ok(home.includes('Fictional production published'));
    assert.ok(!home.includes('PRIVATE_PRODUCTION_NOTE'));
    const detail = await (
      await fetch(`${base}/${locale}/apps/fictional-production-published`)
    ).text();
    assert.ok(detail.includes('Fictional production verification'));
    assert.ok(!detail.includes('PRIVATE_PRODUCTION_NOTE'));
    const history = await (await fetch(`${base}/${locale}/updates`)).text();
    assert.ok(history.includes('Fictional published review'));
    assert.ok(!history.includes('Fictional archived review'));
    for (const state of ['draft', 'archived']) {
      const hidden = await (
        await fetch(`${base}/${locale}/apps/fictional-production-${state}`)
      ).text();
      assert.ok(!hidden.includes(`Fictional production ${state}`));
    }
  }
  assert.ok(!sitemap.includes('fictional-production-draft'));
  assert.ok(!sitemap.includes('fictional-production-archived'));
  assert.ok(!sitemap.includes('sample-'));
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  assert.ok(robots.includes('Disallow: /ko/admin') && robots.includes('Disallow: /en/admin'));
  console.log(
    'PASS production DB: both locales, published-only sitemap/list/detail/history, hidden drafts/archives, private-field exclusion and admin robots.',
  );
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise((resolve) => server.once('exit', resolve));
  }
  await client.end();
}
