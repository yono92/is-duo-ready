import type { DirectoryQuery } from '../../src/lib/directory/types.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connect, asActor } from './helpers.ts';
import { queryDirectory, queryApp, queryHistory } from '../../src/lib/data/postgres-query.ts';

test('public SQL search, pagination, detail aliases and history exclude drafts and private fields', async () => {
  const client = await connect();
  const actor = randomUUID();
  const ids: string[] = [];
  try {
    await client.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
    await asActor(client, actor, async (db) => {
      for (let index = 0; index < 31; index++) {
        const payload = {
          app_store_id: `99002${1000 + index}`,
          slug: `public-query-test-${index}`,
          name: `Public query ${index.toString().padStart(2, '0')}`,
          developer: 'Fictional test only',
          category: 'productivity',
          original_locale: 'en',
          aliases: ['공개실험'],
          status: index === 0 ? 'supported' : index === 1 ? 'planned' : 'unknown',
          investigation_reason: 'Fictional investigation. No actual support claim.',
          evidence:
            index < 2
              ? [
                  {
                    url: 'https://example.com/fictional-query-evidence',
                    title: 'Fictional query test source',
                    kind: 'developer',
                    official_confirmed: true,
                    quote: 'Fictional evidence used only in the isolated query test database.',
                  },
                ]
              : [],
          translations: {
            en: {
              name: `Public query ${index.toString().padStart(2, '0')}`,
              summary: 'Fictional test data',
              state: 'current',
            },
          },
        };
        const app = (
          await db.query('SELECT app_private.save_app($1::jsonb,NULL) AS app', [
            JSON.stringify(payload),
          ])
        ).rows[0].app;
        ids.push(app.id);
        if (index < 30)
          await db.query('SELECT app_private.publish_app($1,$2,$3,$4)', [
            app.id,
            app.revision,
            'Fictional review',
            'PRIVATE QUERY NOTE',
          ]);
      }
    });
    // A separate explicit review makes this unknown-status app the most recently changed.
    await asActor(client, actor, async (db) => {
      await db.query(
        "UPDATE app_private.app_support SET investigation_reason='Fictional second investigation' WHERE app_id=$1",
        [ids[2]],
      );
      await db.query('SELECT app_private.publish_app($1,2,$2)', [ids[2], 'Fictional recency test']);
    });
    await asActor(client, null, async (db) => {
      const query: DirectoryQuery = {
        q: '공개실험',
        category: 'all',
        status: 'all',
        sort: 'name',
        page: 1,
      };
      const result = await queryDirectory(db, query, 'en');
      assert.equal(result.total, 30);
      assert.equal(result.apps.length, 24);
      assert.equal(result.pages, 2);
      assert.equal(result.apps[0].names.en, 'Public query 00');
      assert.equal(
        result.stats.total,
        result.stats.supported +
          result.stats.planned +
          result.stats.unknown +
          result.stats.unsupported,
      );
      assert.ok(result.stats.total >= result.total);
      const recommended = await queryDirectory(db, { ...query, sort: 'recommended' }, 'en');
      assert.equal(recommended.apps[0].status, 'supported');
      assert.equal(recommended.apps[1].status, 'planned');
      const updated = await queryDirectory(db, { ...query, sort: 'updated' }, 'en');
      assert.equal(updated.apps[0].slug, 'public-query-test-2');
      assert.equal((await queryDirectory(db, { ...query, q: 'pUbLiC qUeRy 01' }, 'en')).total, 1);
      assert.equal(
        (await queryDirectory(db, { ...query, category: 'productivity', status: 'planned' }, 'ko'))
          .total,
        1,
      );
      assert.equal(
        (await queryDirectory(db, { ...query, category: 'books', status: 'planned' }, 'ko')).total,
        0,
      );
      const last = await queryDirectory(db, { ...query, page: 999 }, 'ko');
      assert.equal(last.page, 2);
      assert.equal(last.apps.length, 6);
      const empty = await queryDirectory(db, { ...query, category: 'books' }, 'en');
      assert.equal(empty.total, 0);
      assert.deepEqual(empty.apps, []);
      assert.deepEqual(empty.stats, result.stats);
      assert.equal(
        (await queryDirectory(db, { ...query, q: '%', status: 'supported' }, 'en')).total,
        0,
      );
      assert.equal(await queryApp(db, 'public-query-test-30'), null);
      const app = await queryApp(db, 'public-query-test-0');
      assert.ok(app && 'app' in app);
      assert.equal(app.app.slug, 'public-query-test-0');
      const history = await queryHistory(db, 1, ids[0]);
      assert.equal(history.total, 1);
      assert.ok(!JSON.stringify(history).includes(actor));
      assert.ok(!JSON.stringify(history).includes('PRIVATE QUERY NOTE'));
    });
    await asActor(client, actor, async (db) => {
      await db.query("UPDATE app_private.apps SET slug='new-public-query-slug' WHERE id=$1", [
        ids[0],
      ]);
      await db.query('SELECT app_private.publish_app($1,2,$2)', [ids[0], 'Fictional URL update']);
    });
    await asActor(client, null, async (db) => {
      const alias = await queryApp(db, 'public-query-test-0');
      assert.ok(alias && 'redirect' in alias);
      assert.equal(alias.redirect, 'new-public-query-slug');
    });
    await asActor(client, actor, async (db) => {
      await db.query('SELECT app_private.archive_app($1,3,$2)', [ids[0], 'Fictional archive']);
    });
    await asActor(client, null, async (db) => {
      assert.equal(await queryApp(db, 'public-query-test-0'), null);
      assert.equal(await queryApp(db, 'new-public-query-slug'), null);
      assert.equal((await queryHistory(db, 1, ids[0])).total, 0);
    });
  } finally {
    await client.end();
  }
});
