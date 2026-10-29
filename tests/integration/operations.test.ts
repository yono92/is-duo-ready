import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connect, asActor } from './helpers.ts';

async function setup(db: import('pg').Client) {
  const actor = randomUUID();
  await db.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
  const app = await asActor(
    db,
    actor,
    async (db) =>
      (
        await db.query('SELECT app_private.save_app($1,NULL) AS app', [
          {
            app_store_id: String(Date.now()) + String(Math.floor(Math.random() * 10000)),
            slug: 'operations-' + randomUUID(),
            name: 'Fictional operations',
            developer: 'Test only',
            category: 'productivity',
            aliases: [],
            original_locale: 'ko',
            status: 'unknown',
            investigation_reason: 'Test only investigation',
            current_version: '1.0',
            translations: {
              ko: { name: 'Fictional operations', summary: 'Test only', state: 'current' },
            },
            evidence: [],
          },
        ])
      ).rows[0].app,
  );
  return { actor, app };
}

test('collection candidates deduplicate through rejection; leases recover and public data is preserved', async () => {
  const db = await connect();
  try {
    const { actor, app } = await setup(db);
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.publish_app($1,$2,$3)', [app.id, app.revision, 'Test only']),
    );
    const before = (
      await db.query('SELECT snapshot FROM public.directory_entries WHERE app_id=$1', [app.id])
    ).rows[0];
    const target = await asActor(
      db,
      actor,
      async (db) =>
        (
          await db.query(
            `INSERT INTO app_private.collection_targets(app_id,kind,url,approved_host,approval_note) SELECT id,'app_store','https://apps.apple.com/kr/app/id'||app_store_id,'apps.apple.com','Official test fixture' FROM app_private.apps WHERE id=$1 RETURNING id`,
            [app.id],
          )
        ).rows[0].id,
    );
    const claim = () =>
      asActor(
        db,
        actor,
        async (db) =>
          (await db.query('SELECT app_private.claim_collection($1) AS job', [target])).rows[0].job,
      );
    const first = await claim();
    assert.ok(first.run_id);
    assert.equal(await claim(), null);
    const payload = {
      current_version: '2.0',
      release_notes: 'Test only new notes',
      source_url: 'https://apps.apple.com/kr/app/id123',
    };
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.finish_collection($1,$2,$3,NULL)', [
        first.run_id,
        first.token,
        payload,
      ]),
    );
    const review = (
      await db.query('SELECT * FROM app_private.review_items WHERE target_id=$1', [target])
    ).rows[0];
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.decide_review($1,$2,$3,$4,NULL)', [
        review.id,
        review.revision,
        'rejected',
        'No supporting evidence',
      ]),
    );
    for (let i = 0; i < 2; i++) {
      const job = await claim();
      await asActor(db, actor, (db) =>
        db.query('SELECT app_private.finish_collection($1,$2,$3,NULL)', [
          job.run_id,
          job.token,
          payload,
        ]),
      );
    }
    assert.equal(
      (
        await db.query('SELECT count(*)::int n FROM app_private.review_items WHERE target_id=$1', [
          target,
        ])
      ).rows[0].n,
      1,
    );
    const failed = await claim();
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.finish_collection($1,$2,NULL,$3)', [
        failed.run_id,
        failed.token,
        'notFound',
      ]),
    );
    assert.deepEqual(
      (await db.query('SELECT snapshot FROM public.directory_entries WHERE app_id=$1', [app.id]))
        .rows[0],
      before,
    );
    assert.equal(
      (await db.query('SELECT failures FROM app_private.collection_targets WHERE id=$1', [target]))
        .rows[0].failures,
      1,
    );
    const lost = await claim();
    await db.query(
      "UPDATE app_private.collection_targets SET lease_expires_at=now()-interval '1 minute' WHERE id=$1",
      [target],
    );
    const recovered = await claim();
    assert.notEqual(recovered.run_id, lost.run_id);
    assert.equal(
      (await db.query('SELECT state FROM app_private.collection_runs WHERE id=$1', [lost.run_id]))
        .rows[0].state,
      'abandoned',
    );
    await assert.rejects(
      asActor(db, actor, (db) =>
        db.query('SELECT app_private.finish_collection($1,$2,$3,NULL)', [
          lost.run_id,
          lost.token,
          payload,
        ]),
      ),
      { code: '40001' },
    );
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.finish_collection($1,$2,NULL,$3)', [
        recovered.run_id,
        recovered.token,
        'network',
      ]),
    );
    for (const role of [null, randomUUID()]) {
      if (role === null)
        await assert.rejects(
          asActor(db, role, (db) => db.query('SELECT * FROM app_private.review_items')),
          { code: '42501' },
        );
      else
        await asActor(db, role, async (db) =>
          assert.equal((await db.query('SELECT * FROM app_private.review_items')).rowCount, 0),
        );
      await assert.rejects(
        asActor(db, role, (db) => db.query('SELECT app_private.claim_collection(NULL)')),
        { code: '42501' },
      );
    }
  } finally {
    await db.end();
  }
});

test('anonymous intake is private, deduplicated, limited and review approval rolls back atomically', async () => {
  const db = await connect();
  try {
    const { actor, app } = await setup(db);
    const appId = (
      await db.query('SELECT app_store_id FROM app_private.apps WHERE id=$1', [app.id])
    ).rows[0].app_store_id;
    const key = randomUUID().replaceAll('-', '').repeat(2);
    const input = {
      kind: 'correction',
      app_store_id: appId,
      store_url: 'https://apps.apple.com/kr/app/id' + appId,
      body: 'Fictional correction only',
      evidence_url: 'https://example.com/test-only',
    };
    for (let i = 0; i < 5; i++)
      await asActor(db, null, (db) =>
        db.query('SELECT submission_ingress.accept($1,$2)', [input, key]),
      );
    await assert.rejects(
      asActor(db, null, (db) => db.query('SELECT submission_ingress.accept($1,$2)', [input, key])),
      { code: 'P0429' },
    );
    const items = (
      await db.query(
        'SELECT r.* FROM app_private.review_items r JOIN app_private.submissions s ON s.id=r.submission_id WHERE s.app_store_id=$1',
        [appId],
      )
    ).rows;
    assert.equal(items.length, 1);
    const item = items[0];
    await assert.rejects(
      asActor(db, null, (db) => db.query('SELECT * FROM app_private.submissions')),
      { code: '42501' },
    );
    await assert.rejects(
      asActor(db, randomUUID(), (db) =>
        db.query('SELECT app_private.decide_review($1,1,$2,$3,$4)', [
          item.id,
          'approved',
          'Bad actor',
          app.revision,
        ]),
      ),
      { code: '42501' },
    );
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.decide_review($1,1,$2,$3,NULL)', [
        item.id,
        'deferred',
        'Need evidence',
      ]),
    );
    await assert.rejects(
      asActor(db, actor, (db) =>
        db.query('SELECT app_private.decide_review($1,1,$2,$3,$4)', [
          item.id,
          'approved',
          'Stale',
          app.revision,
        ]),
      ),
      { code: '40001' },
    );
    await assert.rejects(
      asActor(db, actor, (db) =>
        db.query('SELECT app_private.decide_review($1,2,$2,$3,$4)', [
          item.id,
          'approved',
          'Stale app draft',
          app.revision + 100,
        ]),
      ),
      { code: '40001' },
    );
    await asActor(db, actor, (db) =>
      db.query("UPDATE app_private.app_support SET status='supported' WHERE app_id=$1", [app.id]),
    );
    await assert.rejects(
      asActor(db, actor, (db) =>
        db.query('SELECT app_private.decide_review($1,2,$2,$3,$4)', [
          item.id,
          'approved',
          'Missing official evidence',
          app.revision,
        ]),
      ),
      { code: '23514' },
    );
    await asActor(db, actor, (db) =>
      db.query("UPDATE app_private.app_support SET status='unknown' WHERE app_id=$1", [app.id]),
    );
    await db.query(
      `CREATE FUNCTION app_private.fail_review_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.state='approved' THEN RAISE EXCEPTION 'Injected final write failure'; END IF; RETURN NEW; END $$`,
    );
    await db.query(
      'CREATE TRIGGER fail_review_test BEFORE UPDATE ON app_private.review_items FOR EACH ROW EXECUTE FUNCTION app_private.fail_review_test()',
    );
    await assert.rejects(
      asActor(db, actor, (db) =>
        db.query('SELECT app_private.decide_review($1,2,$2,$3,$4)', [
          item.id,
          'approved',
          'Test only approval',
          app.revision,
        ]),
      ),
    );
    assert.equal(
      (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id])).rowCount,
      0,
    );
    assert.equal(
      (await db.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id])).rowCount,
      0,
    );
    assert.equal(
      (await db.query('SELECT state FROM app_private.review_items WHERE id=$1', [item.id])).rows[0]
        .state,
      'deferred',
    );
    await db.query('DROP TRIGGER fail_review_test ON app_private.review_items');
    await db.query('DROP FUNCTION app_private.fail_review_test()');
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.decide_review($1,2,$2,$3,$4)', [
        item.id,
        'approved',
        'Test only approval',
        app.revision,
      ]),
    );
    assert.equal(
      (await db.query('SELECT state FROM app_private.review_items WHERE id=$1', [item.id])).rows[0]
        .state,
      'approved',
    );
    assert.equal(
      (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id])).rowCount,
      1,
    );
    await assert.rejects(
      asActor(db, actor, (db) =>
        db.query('SELECT app_private.decide_review($1,3,$2,$3,$4)', [
          item.id,
          'approved',
          'Duplicate',
          app.revision + 1,
        ]),
      ),
      { code: '40001' },
    );
  } finally {
    await db.end();
  }
});

test('concurrent intake enforces the visitor and site caps without granting direct table writes', async () => {
  const db = await connect();
  const connections = await Promise.all(Array.from({ length: 7 }, () => connect()));
  const key = randomUUID().replaceAll('-', '').repeat(2);
  const input = {
    kind: 'add',
    app_store_id: '990005777',
    store_url: 'https://apps.apple.com/kr/app/id990005777',
    body: 'Fictional concurrent intake',
    evidence_url: 'https://example.com/concurrent',
  };
  try {
    const results = await Promise.allSettled(
      connections.map((client) =>
        asActor(client, null, (db) =>
          db.query('SELECT submission_ingress.accept($1,$2)', [input, key]),
        ),
      ),
    );
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 5);
    assert.equal(
      results.filter((r) => r.status === 'rejected' && r.reason.code === 'P0429').length,
      2,
    );
    await assert.rejects(
      asActor(db, null, (db) =>
        db.query("INSERT INTO app_private.submissions(kind) VALUES('add')"),
      ),
      { code: '42501' },
    );
    await assert.rejects(
      asActor(db, randomUUID(), (db) =>
        db.query("INSERT INTO app_private.submissions(kind) VALUES('add')"),
      ),
      { code: '42501' },
    );
    await db.query(
      "INSERT INTO app_private.submission_limits(bucket,hour,requests) VALUES('global',date_trunc('hour',now()),60) ON CONFLICT(bucket,hour) DO UPDATE SET requests=60",
    );
    await assert.rejects(
      asActor(db, null, (db) =>
        db.query('SELECT submission_ingress.accept($1,$2)', [
          input,
          randomUUID().replaceAll('-', '').repeat(2),
        ]),
      ),
      { code: 'P0429' },
    );
  } finally {
    await db.query("DELETE FROM app_private.submission_limits WHERE bucket='global'");
    await Promise.all(connections.map((client) => client.end()));
    await db.end();
  }
});

test('durable worker records attempts and creates a private observation without modifying the draft', async () => {
  const { Pool } = await import('pg');
  const { withActor } = await import('../../src/lib/db/transaction.ts');
  const { runCollection } = await import('../../src/lib/collection/worker.ts');
  const db = await connect();
  const pool = new Pool({ connectionString: process.env.DUO_TEST_DATABASE_URL, max: 3 });
  try {
    const { actor, app } = await setup(db);
    const storeId = (
      await db.query('SELECT app_store_id FROM app_private.apps WHERE id=$1', [app.id])
    ).rows[0].app_store_id;
    const target = (
      await asActor(db, actor, (db) =>
        db.query(
          `INSERT INTO app_private.collection_targets(app_id,kind,url,approved_host,approval_note) VALUES($1,'app_store',$2,'apps.apple.com','Test only worker fixture') RETURNING id`,
          [app.id, 'https://apps.apple.com/kr/app/id' + storeId],
        ),
      )
    ).rows[0].id;
    const result = await runCollection(
      (actor, operation) => withActor(pool, actor, operation),
      actor,
      target,
      {
        appleLookup: async (id, { beforeAttempt } = {}) => {
          await beforeAttempt?.();
          // The attempt must already be committed and visible on an independent connection while HTTP is running.
          assert.equal(
            (
              await db.query(
                'SELECT attempts FROM app_private.collection_runs WHERE target_id=$1',
                [target],
              )
            ).rows[0].attempts,
            1,
          );
          assert.equal(id, storeId);
          return {
            app_store_id: id,
            name: 'Fictional collection app',
            developer: 'Test only',
            category: 'productivity',
            primary_genre_id: '6007',
            primary_genre_name: 'Productivity',
            store_url: `https://apps.apple.com/kr/app/id${id}`,
            icon_url: null,
            current_version: '2.0',
            release_notes: 'Fictional changed release notes',
            fetched_at: new Date().toISOString(),
          };
        },
      },
    );
    assert.equal(result.state, 'succeeded');
    const review = (
      await db.query('SELECT candidate_payload FROM app_private.review_items WHERE target_id=$1', [
        target,
      ])
    ).rows[0];
    assert.equal(review.candidate_payload.current_version, '2.0');
    assert.equal('fetched_at' in review.candidate_payload, false);
    const previousClock = (
      await db.query('SELECT last_attempt_at FROM app_private.import_clock WHERE singleton')
    ).rows[0].last_attempt_at;
    const { ImportError } = await import('../../src/lib/import/apple.ts');
    const failed = await runCollection(
      (actor, operation) => withActor(pool, actor, operation),
      actor,
      target,
      {
        appleLookup: async (_id, { beforeAttempt } = {}) => {
          await beforeAttempt?.();
          throw new ImportError('notFound');
        },
      },
    );
    assert.equal(failed.state, 'failed');
    assert.ok(
      (await db.query('SELECT last_attempt_at FROM app_private.import_clock WHERE singleton'))
        .rows[0].last_attempt_at > previousClock,
    );
    assert.equal(
      (await db.query('SELECT failures FROM app_private.collection_targets WHERE id=$1', [target]))
        .rows[0].failures,
      1,
    );
    assert.equal(
      (
        await db.query(
          'SELECT count(*)::int n FROM app_private.collection_observations WHERE target_id=$1',
          [target],
        )
      ).rows[0].n,
      1,
    );

    assert.equal(
      (
        await db.query(
          'SELECT current_version FROM app_private.app_store_listings WHERE app_id=$1',
          [app.id],
        )
      ).rows[0].current_version,
      '1.0',
    );
    assert.equal(
      (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id])).rowCount,
      0,
    );
  } finally {
    await pool.end();
    await db.end();
  }
});
