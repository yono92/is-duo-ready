import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connect, asActor } from './helpers.ts';

test('publication requires evidence, remains atomic on failure and preserves reviewed snapshots while editing', async () => {
  const client = await connect();
  const admin = randomUUID();
  try {
    await client.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [admin]);
    const payload = {
      id: undefined as string | undefined,
      current_version: undefined as string | undefined,
      app_store_id: '99001002001',
      slug: 'fictional-publication-test',
      name: 'Fictional publication',
      developer: 'Test only',
      category: 'productivity',
      original_locale: 'en',
      translations: {
        en: { name: 'Fictional publication', summary: 'Test only summary', state: 'current' },
      },
      status: 'supported',
      evidence: [] as Record<string, unknown>[],
    };
    const save = (body: unknown, revision: number | null = null) =>
      asActor(
        client,
        admin,
        async (db) =>
          (
            await db.query('SELECT app_private.save_app($1::jsonb,$2) AS app', [
              JSON.stringify(body),
              revision,
            ])
          ).rows[0].app,
      );
    const publish = (app: { id: string; revision: number }, reason = 'Fictional test review') =>
      asActor(
        client,
        admin,
        async (db) =>
          (
            await db.query('SELECT app_private.publish_app($1,$2,$3,$4) AS result', [
              app.id,
              app.revision,
              reason,
              'PRIVATE TEST NOTE',
            ])
          ).rows[0].result,
      );
    let app = await save(payload);
    await assert.rejects(publish(app), { code: '23514' });
    payload.id = app.id;
    for (const status of ['planned', 'unsupported', 'unknown']) {
      app = await save({ ...payload, status }, app.revision);
      await assert.rejects(publish(app), { code: '23514' });
    }
    payload.evidence = [
      {
        url: 'https://example.com/fictional-test-only',
        title: 'Fictional source',
        kind: 'developer',
        official_confirmed: true,
        quote: 'Fictional test evidence, never real app support.',
      },
    ];
    app = await save(payload, app.revision);
    // Fail the last audit insert, after projection/history writes in the function.
    await client.query(`CREATE FUNCTION app_private.test_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'intentional audit failure'; END $$;
      CREATE TRIGGER test_fail_audit BEFORE INSERT ON app_private.review_events
      FOR EACH ROW EXECUTE FUNCTION app_private.test_fail_audit();`);
    await assert.rejects(publish(app), { code: 'P0001' });
    assert.equal(
      (await client.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id]))
        .rowCount,
      0,
    );
    assert.equal(
      (await client.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id]))
        .rowCount,
      0,
    );
    assert.equal(
      (
        await client.query('SELECT reviewed_at FROM app_private.app_support WHERE app_id=$1', [
          app.id,
        ])
      ).rows[0].reviewed_at,
      null,
    );
    await client.query(
      'DROP TRIGGER test_fail_audit ON app_private.review_events; DROP FUNCTION app_private.test_fail_audit();',
    );
    app = await publish(app);
    let old;
    await asActor(client, null, async (db) => {
      old = (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id]))
        .rows[0];
      assert.equal(old.snapshot.status, 'supported');
      assert.equal(old.snapshot.fictional, false);
      assert.ok(!JSON.stringify(old).includes(admin));
      assert.ok(!JSON.stringify(old).includes('PRIVATE TEST NOTE'));
      assert.ok(old.snapshot.evidence[0].quote);
    });
    payload.status = 'planned';
    app = await save(payload, app.revision);
    assert.equal(
      (
        await client.query('SELECT snapshot FROM public.directory_entries WHERE app_id=$1', [
          app.id,
        ])
      ).rows[0].snapshot.status,
      'supported',
    );
    app = await publish(app, 'Fictional correction');
    assert.equal(
      (await client.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id]))
        .rowCount,
      2,
    );
    payload.current_version = '99.0';
    app = await save(payload, app.revision);
    app = await publish(app, 'Metadata only');
    assert.equal(
      (await client.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id]))
        .rowCount,
      2,
    );
    await asActor(client, admin, async (db) => {
      await assert.rejects(
        db.query('DELETE FROM public.support_history WHERE app_id=$1', [app.id]),
        { code: '42501' },
      );
      // Recover the aborted transaction is handled by outer asActor; test the grant independently below.
      throw new Error('rollback after expected denial');
    }).catch((error) => assert.equal(error.message, 'rollback after expected denial'));
    app = await asActor(
      client,
      admin,
      async (db) =>
        (
          await db.query('SELECT app_private.archive_app($1,$2,$3) AS app', [
            app.id,
            app.revision,
            'Fictional archive',
          ])
        ).rows[0].app,
    );
    await asActor(client, null, async (db) => {
      assert.equal(
        (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id]))
          .rowCount,
        0,
      );
      assert.equal(
        (await db.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id])).rowCount,
        0,
      );
    });
    assert.equal(
      (await client.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id]))
        .rowCount,
      2,
    );
    app = await publish(app, 'Fictional republication');
    await asActor(client, null, async (db) => {
      assert.equal(
        (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id]))
          .rowCount,
        1,
      );
      assert.equal(
        (await db.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id])).rowCount,
        3,
      );
    });
  } finally {
    await client.end();
  }
});
