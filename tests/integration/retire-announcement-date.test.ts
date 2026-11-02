import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect, asActor } from './helpers.ts';
import { databaseClient, applyMigrations } from '../../scripts/lib/database.ts';

test('006 to 007 removes dates without changing evidence identity, review history or deduplication', async () => {
  const maintenance = await connect();
  const name = `duo_test_${randomUUID().replaceAll('-', '')}`;
  const legacy = await mkdtemp(join(tmpdir(), 'duo-legacy-dates-'));
  let db;
  let created = false;
  try {
    for (const file of await readdir('db/migrations'))
      if (/^00[1-6]_/.test(file)) await copyFile(join('db/migrations', file), join(legacy, file));
    await maintenance.query(`CREATE DATABASE ${name}`);
    created = true;
    const url = new URL(process.env.DUO_TEST_DATABASE_URL!);
    url.pathname = `/${name}`;
    db = databaseClient(url.toString());
    await db.connect();
    await applyMigrations(db, legacy);
    const actor = randomUUID();
    await db.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
    const payload = {
      app_store_id: '99007001',
      slug: 'retired-date-test',
      name: 'Fictional date retirement',
      developer: 'Test only',
      category: 'productivity',
      original_locale: 'en',
      status: 'supported',
      support_version: '1.0',
      translations: {
        en: { name: 'Fictional date retirement', summary: 'Isolated test', state: 'current' },
      },
      evidence: [
        {
          url: 'https://example.com/retired-date-test',
          title: 'Test source',
          kind: 'developer',
          official_confirmed: true,
          quote: 'Fictional test evidence',
          support_version: '1.0',
          announced_at: '2026-10-20',
          features: [{ key: 'wide-layout', description: 'Test feature' }],
        },
      ],
    };
    const app = await asActor(db, actor, async (client) => {
      const saved = (await client.query('SELECT app_private.save_app($1,NULL) AS app', [payload]))
        .rows[0].app;
      return (
        await client.query('SELECT app_private.publish_app($1,$2,$3) AS app', [
          saved.id,
          saved.revision,
          'Fictional initial review',
        ])
      ).rows[0].app;
    });
    const evidence = (await db.query('SELECT * FROM app_private.evidence')).rows[0];
    const before = (await db.query('SELECT * FROM public.directory_entries')).rows[0];
    const history = (await db.query('SELECT * FROM public.support_history')).rows;
    const proposal = { source_url: payload.evidence[0].url, announced_at: '2026-10-20' };
    await db.query(
      `INSERT INTO app_private.import_proposals(app_id,proposal,fingerprint)
      VALUES($1,$2,encode(sha256(convert_to($2::jsonb::text,'UTF8')),'hex'))`,
      [app.id, proposal],
    );
    const legacyProposal = (await db.query('SELECT * FROM app_private.import_proposals')).rows[0];
    // Keep this upgrade regression bounded to its own migration as new ones are added.
    await copyFile(
      'db/migrations/007_remove_evidence_announcement_date.sql',
      join(legacy, '007_remove_evidence_announcement_date.sql'),
    );

    // Different dates previously allowed otherwise-identical evidence. Abort safely
    // rather than silently deleting one and breaking its feature/snapshot references.
    const duplicate = (
      await db.query(
        `INSERT INTO app_private.evidence
      (source_id,quote,support_version,country,announced_at) VALUES($1,$2,'1.0','KR','2026-10-21') RETURNING id`,
        [evidence.source_id, evidence.quote],
      )
    ).rows[0];
    await assert.rejects(applyMigrations(db, legacy), { code: '23505' });
    assert.equal(
      (
        await db.query(`SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_schema='app_private' AND table_name='evidence' AND column_name='announced_at'`)
      ).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query('SELECT count(*)::int AS n FROM app_private.evidence')).rows[0].n,
      2,
    );
    await db.query('DELETE FROM app_private.evidence WHERE id=$1', [duplicate.id]);
    const duplicateProposal = (
      await db.query(
        `INSERT INTO app_private.import_proposals(app_id,proposal,fingerprint)
      VALUES($1,$2,encode(sha256(convert_to($2::jsonb::text,'UTF8')),'hex')) RETURNING id`,
        [app.id, { ...proposal, announced_at: '2026-10-21' }],
      )
    ).rows[0];
    await assert.rejects(applyMigrations(db, legacy), { code: '23505' });
    await db.query('DELETE FROM app_private.import_proposals WHERE id=$1', [duplicateProposal.id]);

    assert.deepEqual(await applyMigrations(db, legacy), [
      '007_remove_evidence_announcement_date.sql',
    ]);
    assert.deepEqual(await applyMigrations(db, legacy), []);
    assert.equal(
      (
        await db.query(`SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_schema='app_private' AND table_name='evidence' AND column_name='announced_at'`)
      ).rows[0].n,
      0,
    );
    const currentEvidence = (await db.query('SELECT * FROM app_private.evidence')).rows[0];
    assert.equal(currentEvidence.id, evidence.id);
    assert.equal(currentEvidence.source_id, evidence.source_id);
    assert.ok(!Object.hasOwn(currentEvidence, 'announced_at'));
    const expectedSnapshot = structuredClone(before.snapshot);
    for (const item of expectedSnapshot.evidence) delete item.announcedAt;
    assert.deepEqual((await db.query('SELECT * FROM public.directory_entries')).rows[0], {
      ...before,
      snapshot: expectedSnapshot,
    });
    assert.deepEqual((await db.query('SELECT * FROM public.support_history')).rows, history);
    const currentProposal = (await db.query('SELECT * FROM app_private.import_proposals')).rows[0];
    assert.equal(currentProposal.id, legacyProposal.id);
    assert.equal(currentProposal.created_at.getTime(), legacyProposal.created_at.getTime());
    assert.ok(!Object.hasOwn(currentProposal.proposal, 'announced_at'));

    // Even an old client cannot resurrect the removed field or duplicate evidence.
    await asActor(db, actor, async (client) => {
      const saved = (
        await client.query('SELECT app_private.save_app($1,$2) AS app', [
          { ...payload, id: app.id },
          app.revision,
        ])
      ).rows[0].app;
      await client.query('SELECT app_private.publish_app($1,$2,$3)', [
        saved.id,
        saved.revision,
        'No support change',
      ]);
      assert.equal(
        (await client.query('SELECT count(*)::int AS n FROM app_private.evidence')).rows[0].n,
        1,
      );
      assert.equal(
        (await client.query('SELECT evidence_id FROM app_private.support_features')).rows[0]
          .evidence_id,
        evidence.id,
      );
      const imported = await client.query('SELECT app_private.import_app($1,$2)', [
        {
          app_store_id: payload.app_store_id,
          name: payload.name,
          developer: payload.developer,
          category: payload.category,
          fetched_at: new Date().toISOString(),
        },
        proposal,
      ]);
      assert.equal(imported.rowCount, 1);
      assert.equal(
        (await client.query('SELECT count(*)::int AS n FROM app_private.import_proposals')).rows[0]
          .n,
        1,
      );
    });
    assert.deepEqual((await db.query('SELECT * FROM public.support_history')).rows, history);
    assert.deepEqual(
      (await db.query('SELECT support_changed_at FROM public.directory_entries')).rows[0]
        .support_changed_at,
      before.support_changed_at,
    );
    await asActor(db, null, async (client) => {
      const published = (await client.query('SELECT snapshot FROM public.directory_entries'))
        .rows[0].snapshot;
      assert.ok(!Object.hasOwn(published.evidence[0], 'announcedAt'));
    });
  } finally {
    await db?.end();
    if (created) await maintenance.query(`DROP DATABASE ${name} WITH (FORCE)`);
    await maintenance.end();
    await rm(legacy, { recursive: true, force: true });
  }
});
