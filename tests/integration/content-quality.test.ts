import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connect } from './helpers.ts';
import { auditContentQuality } from '../../scripts/lib/content-quality.ts';
import { queryDirectory } from '../../src/lib/data/postgres-query.ts';

test('quality checks detect broken public contracts without rewriting pending edits or historical evidence', async () => {
  const db = await connect();
  try {
    await db.query('BEGIN');
    const before = await auditContentQuality(db);
    const get = (audit: Awaited<ReturnType<typeof auditContentQuality>>, key: string) =>
      audit.checks.find((check) => check.key === key)!.count;
    const app = (
      await db.query(
        `INSERT INTO app_private.apps(app_store_id,slug,name,developer,category,publication) VALUES('990070001','quality-contract','Fictional quality test','Test only','productivity','published') RETURNING id`,
      )
    ).rows[0];
    await db.query(
      `INSERT INTO app_private.app_store_listings(app_id,store_url,current_version,release_notes,observed_metadata) VALUES($1,'https://apps.apple.com/kr/app/id990070001','1.0','Latest notes','{"release_notes":"Latest notes"}')`,
      [app.id],
    );
    await db.query(
      `INSERT INTO app_private.app_support(app_id,status,investigation_reason) VALUES($1,'unknown','Fictional investigation')`,
      [app.id],
    );
    for (const locale of ['ko', 'en'])
      await db.query(
        `INSERT INTO app_private.app_translations(app_id,locale,name,summary,state) VALUES($1,$2,'Fictional quality test','Fictional summary','current')`,
        [app.id, locale],
      );
    await db.query(
      `INSERT INTO public.directory_entries(app_id,slug,publication,reviewed_at,support_changed_at,snapshot) VALUES($1,'quality-contract','published',now(),now(),$2)`,
      [
        app.id,
        {
          slug: 'quality-contract',
          fictional: false,
          publication: 'published',
          country: 'KR',
          names: { ko: 'Fictional quality test', en: 'Fictional quality test' },
          aliases: [],
          category: 'productivity',
          storeUrl: 'https://apps.apple.com/kr/app/id990070001',
          status: 'unknown',
          currentVersion: '1.0',
          supportVersion: null,
          evidence: [],
          investigationReason: 'Fictional investigation',
          originalLocale: 'ko',
          translations: {
            ko: { summary: 'Fictional summary', state: 'current' },
            en: { summary: 'Fictional summary', state: 'current' },
          },
        },
      ],
    );
    const valid = await auditContentQuality(db);
    assert.equal(get(valid, 'invalid_public_snapshot'), get(before, 'invalid_public_snapshot'));
    assert.equal(
      get(valid, 'pending_public_draft_difference'),
      get(before, 'pending_public_draft_difference'),
    );
    await db.query(`UPDATE app_private.app_support SET status='supported' WHERE app_id=$1`, [
      app.id,
    ]);
    const pending = await auditContentQuality(db);
    assert.equal(
      get(pending, 'decided_support_without_evidence'),
      get(before, 'decided_support_without_evidence'),
    );
    assert.equal(
      get(pending, 'draft_decision_missing_evidence'),
      get(before, 'draft_decision_missing_evidence') + 1,
    );
    assert.equal(
      get(pending, 'pending_public_draft_difference'),
      get(before, 'pending_public_draft_difference') + 1,
    );
    assert.equal(
      (
        await db.query(
          "SELECT snapshot->>'status' AS status FROM public.directory_entries WHERE app_id=$1",
          [app.id],
        )
      ).rows[0].status,
      'unknown',
    );
    await db.query(
      `UPDATE public.directory_entries SET snapshot=jsonb_set(snapshot,'{status}','"supported"') WHERE app_id=$1`,
      [app.id],
    );
    const unbacked = await auditContentQuality(db);
    assert.equal(
      get(unbacked, 'decided_support_without_evidence'),
      get(before, 'decided_support_without_evidence') + 1,
    );
    await db.query(
      `UPDATE public.directory_entries SET snapshot=jsonb_set(snapshot,'{status}','"bogus"') WHERE app_id=$1`,
      [app.id],
    );
    const broken = await auditContentQuality(db);
    assert.equal(
      get(broken, 'invalid_public_snapshot'),
      get(before, 'invalid_public_snapshot') + 1,
    );
    await assert.rejects(
      queryDirectory(db, { q: '', category: 'all', status: 'all', sort: 'name', page: 1 }, 'en'),
      /do not reconcile/,
    );
    await db.query(
      `UPDATE public.directory_entries SET snapshot=jsonb_set(snapshot,'{status}','"unknown"') WHERE app_id=$1`,
      [app.id],
    );
    const source = (
      await db.query(
        `INSERT INTO app_private.sources(url,title,kind,official_confirmed) VALUES('https://apps.apple.com/kr/app/id990070001','Fictional source','app_store',true) RETURNING id`,
      )
    ).rows[0];
    const evidence = (
      await db.query(
        `INSERT INTO app_private.evidence(source_id,quote,country) VALUES($1,'Historical captured note','KR') RETURNING id`,
        [source.id],
      )
    ).rows[0];
    await db.query('INSERT INTO app_private.app_evidence(app_id,evidence_id) VALUES($1,$2)', [
      app.id,
      evidence.id,
    ]);
    const historical = await auditContentQuality(db);
    assert.equal(
      get(historical, 'decided_support_without_evidence'),
      get(before, 'decided_support_without_evidence'),
    );
    assert.equal(
      get(historical, 'historical_quote_not_in_latest_notes'),
      get(before, 'historical_quote_not_in_latest_notes') + 1,
    );
    assert.equal(
      historical.checks.find((check) => check.key === 'historical_quote_not_in_latest_notes')!
        .severity,
      'warning',
    );
    await db.query(
      `UPDATE public.directory_entries SET snapshot=snapshot||$2::jsonb WHERE app_id=$1`,
      [
        app.id,
        {
          status: 'supported',
          evidence: [
            {
              id: evidence.id,
              url: 'https://apps.apple.com/kr/app/id990070001',
              quote: 'Historical captured note',
            },
          ],
        },
      ],
    );
    await db.query('DELETE FROM app_private.app_evidence WHERE app_id=$1', [app.id]);
    const retained = await auditContentQuality(db);
    assert.equal(
      get(retained, 'decided_support_without_evidence'),
      get(before, 'decided_support_without_evidence'),
    );
    assert.equal(
      get(retained, 'draft_decision_missing_evidence'),
      get(before, 'draft_decision_missing_evidence') + 1,
    );
  } finally {
    await db.query('ROLLBACK');
    await db.end();
  }
});
