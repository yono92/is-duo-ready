import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connect, asActor } from './helpers.ts';

test('imports deduplicate, preserve reviewed public data and remain invisible to non-admins', async () => {
  const db = await connect();
  const actor = randomUUID();
  try {
    await db.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
    const metadata = {
      app_store_id: '990004001',
      name: 'Fictional import',
      developer: 'Test only',
      category: null,
      current_version: '1.0',
      release_notes: null,
      icon_url: null,
      fetched_at: new Date().toISOString(),
    };
    const proposal = {
      source_url: 'https://example.com/fictional-import',
      evidence_summary: 'Fictional suggestion',
      proposed_status: 'supported',
      announced_at: '',
      support_version: '1.0',
    };
    const imported = await asActor(
      db,
      actor,
      async (db) =>
        (await db.query('SELECT app_private.import_app($1,$2) AS app', [metadata, proposal]))
          .rows[0].app,
    );
    assert.equal(imported.state, 'created');
    await asActor(db, actor, async (db) => {
      const app = (await db.query('SELECT * FROM app_private.apps WHERE id=$1', [imported.id]))
        .rows[0];
      assert.equal(app.publication, 'draft');
      assert.equal(app.category, null);
      assert.equal(
        (
          await db.query(
            'SELECT count(*)::int AS n FROM app_private.app_evidence WHERE app_id=$1',
            [imported.id],
          )
        ).rows[0].n,
        0,
      );
      const saved = (
        await db.query('SELECT app_private.save_app($1,$2) AS app', [
          {
            ...app,
            category: 'productivity',
            status: 'unknown',
            investigation_reason: 'Fictional review with no support assertion',
            current_version: '1.0',
            translations: { ko: { name: app.name, summary: 'Test only', state: 'current' } },
            evidence: [],
          },
          app.revision,
        ])
      ).rows[0].app;
      await db.query('SELECT app_private.publish_app($1,$2,$3)', [
        saved.id,
        saved.revision,
        'Test only manual review',
      ]);
    });
    const before = (
      await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [imported.id])
    ).rows[0];
    const auditBefore = (
      await db.query('SELECT count(*)::int AS n FROM public.support_history WHERE app_id=$1', [
        imported.id,
      ])
    ).rows[0].n;
    metadata.current_version = '2.0';
    metadata.fetched_at = new Date().toISOString();
    await asActor(db, actor, async (db) => {
      assert.equal(
        (await db.query('SELECT app_private.import_app($1,$2) AS app', [metadata, proposal]))
          .rows[0].app.state,
        'updated',
      );
      assert.equal(
        (
          await db.query('SELECT app_private.import_app($1,$2) AS app', [
            { ...metadata, fetched_at: new Date().toISOString() },
            proposal,
          ])
        ).rows[0].app.state,
        'duplicate',
      );
      assert.equal(
        (
          await db.query(
            'SELECT count(*)::int AS n FROM app_private.import_proposals WHERE app_id=$1',
            [imported.id],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await db.query(
            'SELECT current_version FROM app_private.app_store_listings WHERE app_id=$1',
            [imported.id],
          )
        ).rows[0].current_version,
        '2.0',
      );
    });
    assert.deepEqual(
      (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [imported.id]))
        .rows[0],
      before,
    );
    assert.equal(
      (
        await db.query('SELECT count(*)::int AS n FROM public.support_history WHERE app_id=$1', [
          imported.id,
        ])
      ).rows[0].n,
      auditBefore,
    );
    await assert.rejects(
      asActor(db, randomUUID(), async (db) =>
        db.query('SELECT app_private.import_app($1,$2)', [metadata, proposal]),
      ),
      { code: '42501' },
    );
    await asActor(db, randomUUID(), async (db) =>
      assert.equal((await db.query('SELECT * FROM app_private.import_proposals')).rowCount, 0),
    );
    await assert.rejects(
      asActor(db, null, (db) => db.query('SELECT * FROM app_private.import_proposals')),
      { code: '42501' },
    );
  } finally {
    await db.end();
  }
});
