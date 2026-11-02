import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connect, asActor } from './helpers.ts';
import { fictionalCharts } from '../fixtures/chart-rankings.ts';
import { syncChartRankings } from '../../scripts/lib/chart-rankings.ts';
import { queryDirectory } from '../../src/lib/data/postgres-query.ts';
import type { DirectoryQuery } from '../../src/lib/directory/types.ts';

test('chart sorting preserves the catalogue, support history and public/admin boundaries', async () => {
  const db = await connect();
  const actor = randomUUID();
  try {
    await db.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
    const apps: { id: string; storeId: string; slug: string }[] = [];
    await asActor(db, actor, async (client) => {
      for (let index = 0; index < 5; index++) {
        const storeId = `9900820${index}`;
        const slug = `ranking-fixture-${index}`;
        const saved = (
          await client.query('SELECT app_private.save_app($1,NULL) AS app', [
            {
              app_store_id: storeId,
              slug,
              name: `Ranking fixture ${index}`,
              developer: 'Isolated test only',
              category: index === 1 ? 'music' : 'productivity',
              original_locale: 'en',
              status: index === 0 || index === 3 ? 'supported' : 'unknown',
              investigation_reason: 'Fictional test; no support assertion',
              translations: {
                en: {
                  name: `Ranking fixture ${index}`,
                  summary: 'Fictional test only',
                  state: 'current',
                },
              },
              evidence:
                index === 0 || index === 3
                  ? [
                      {
                        url: `https://example.com/fictional-ranking-${index}`,
                        title: 'Isolated test source',
                        kind: 'developer',
                        official_confirmed: true,
                        quote: 'Fictional support evidence for an isolated test only',
                      },
                    ]
                  : [],
            },
          ])
        ).rows[0].app;
        apps.push({ id: saved.id, slug, storeId });
        if (index < 4)
          await client.query('SELECT app_private.publish_app($1,$2,$3)', [
            saved.id,
            saved.revision,
            'Fictional ranking test',
          ]);
      }
    });
    const before = (await db.query('SELECT * FROM public.support_history ORDER BY id')).rows;
    const beforeSupport = (await db.query('SELECT * FROM app_private.app_support ORDER BY app_id'))
      .rows;
    const manifest = fictionalCharts(
      [apps[2].storeId, apps[1].storeId, apps[0].storeId, apps[4].storeId],
      [apps[0].storeId, apps[2].storeId, apps[1].storeId, apps[4].storeId],
    );
    await asActor(db, actor, async (client) => {
      const result = await syncChartRankings(client, manifest);
      assert.deepEqual(
        result.map((r) => r.stored),
        [4, 4],
      );
      await syncChartRankings(client, manifest);
      assert.equal(
        (await client.query('SELECT count(*)::int n FROM public.app_chart_rankings')).rows[0].n,
        8,
      );
    });
    const query: DirectoryQuery = {
      q: 'Ranking fixture',
      category: 'all',
      status: 'all',
      sort: 'top-free',
      page: 1,
    };
    await asActor(db, null, async (client) => {
      assert.equal(
        (await client.query('SELECT count(*)::int n FROM public.app_chart_rankings')).rows[0].n,
        6,
      );
      const free = await queryDirectory(client, query, 'en');
      assert.equal(free.total, 4);
      assert.deepEqual(
        free.apps.map((a) => a.slug),
        [apps[0].slug, apps[3].slug, apps[2].slug, apps[1].slug],
      );
      assert.deepEqual(
        free.apps.map((a) => a.chartRank),
        [3, null, 1, 2],
      );
      assert.ok(free.ranking);
      assert.equal(new Date(free.ranking.observedAt).toISOString(), '2026-11-02T00:00:00.000Z');
      const paid = await queryDirectory(client, { ...query, sort: 'top-paid' }, 'ko');
      assert.deepEqual(
        paid.apps.map((a) => a.slug),
        [apps[0].slug, apps[3].slug, apps[2].slug, apps[1].slug],
      );
      assert.deepEqual(paid.stats, free.stats);
      const filtered = await queryDirectory(client, { ...query, category: 'music' }, 'ko');
      assert.equal(filtered.apps[0].chartRank, 2); // Overall rank, not renumbered within the category.
      assert.deepEqual(filtered.stats, free.stats);
      const supported = await queryDirectory(client, { ...query, status: 'supported' }, 'en');
      assert.deepEqual(
        supported.apps.map((app) => app.slug),
        [apps[0].slug, apps[3].slug],
      );
      assert.deepEqual(supported.stats, free.stats);
      const empty = await queryDirectory(client, { ...query, status: 'planned' }, 'en');
      assert.equal(empty.total, 0);
      assert.deepEqual(empty.stats, free.stats);
      const names = await queryDirectory(client, { ...query, sort: 'name' }, 'en');
      assert.ok(names.apps.every((a) => a.chartRank === null));
      assert.equal(names.ranking, null);
    });
    await assert.rejects(
      asActor(db, randomUUID(), (client) =>
        client.query(
          `INSERT INTO public.app_chart_rankings(app_id,chart_kind,rank,source_url,chart_updated_at,observed_at)
      VALUES($1,'top-free',5,'https://rss.marketingtools.apple.com/api/v2/kr/apps/top-free/100/apps.json',now(),now())`,
          [apps[3].id],
        ),
      ),
      { code: '42501' },
    );
    const rankBefore = (
      await db.query('SELECT * FROM public.app_chart_rankings ORDER BY chart_kind,rank')
    ).rows;
    const partial = structuredClone(manifest);
    partial.charts[0].observedAt = '2026-11-03T00:00:00Z';
    partial.charts[1].observedAt = '2026-11-01T00:00:00Z';
    await assert.rejects(
      asActor(db, actor, (client) => syncChartRankings(client, partial)),
      /newer chart/,
    );
    assert.deepEqual(
      (await db.query('SELECT * FROM public.app_chart_rankings ORDER BY chart_kind,rank')).rows,
      rankBefore,
    );
    assert.deepEqual(
      (await db.query('SELECT * FROM public.support_history ORDER BY id')).rows,
      before,
    );
    assert.deepEqual(
      (await db.query('SELECT * FROM app_private.app_support ORDER BY app_id')).rows,
      beforeSupport,
    );

    // Rollout without the additive table falls back cleanly; other DB failures are not hidden.
    await db.query('BEGIN');
    try {
      await db.query('ALTER TABLE public.app_chart_rankings RENAME TO rankings_rollout_test');
      await db.query('SET LOCAL ROLE anon');
      const fallback = await queryDirectory(db, query, 'en');
      assert.equal(fallback.total, 4);
      assert.equal(fallback.ranking, null);
      assert.ok(fallback.apps.every((a) => a.chartRank === null));
      assert.deepEqual(
        fallback.apps.map((app) => app.slug),
        [apps[0].slug, apps[3].slug, apps[1].slug, apps[2].slug],
      );
    } finally {
      await db.query('ROLLBACK');
    }
  } finally {
    await db.end();
  }
});
