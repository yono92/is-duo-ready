import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { asActor, connect } from './helpers.ts';

async function setup(db: import('pg').Client, published = true) {
  const actor = randomUUID();
  const storeId = `9${Date.now()}${Math.floor(Math.random() * 1000)}`;
  await db.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
  const app = await asActor(
    db,
    actor,
    async (db) =>
      (
        await db.query('SELECT app_private.save_app($1,NULL) AS app', [
          {
            app_store_id: storeId,
            slug: `usage-${randomUUID()}`,
            name: 'Fictional usage report app',
            developer: 'Test only',
            category: 'productivity',
            aliases: [],
            original_locale: 'en',
            status: 'unknown',
            investigation_reason: 'Fictional test investigation only',
            current_version: '1.0',
            translations: {
              en: { name: 'Fictional usage report app', summary: 'Test only', state: 'current' },
            },
            evidence: [],
          },
        ])
      ).rows[0].app,
  );
  if (published)
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.publish_app($1,$2,$3)', [app.id, app.revision, 'Test only']),
    );
  return { actor, app, storeId };
}

function input(storeId: string) {
  return {
    kind: 'usage',
    app_store_id: storeId,
    store_url: `https://apps.apple.com/kr/app/id${storeId}`,
    body: 'Fictional observation: text clips while folding.',
    evidence_url: null,
    locale: 'en',
    publish_consent: true,
    usage: {
      device_model: 'iPhone Duo',
      environment: 'simulator',
      os_version: '27.1',
      app_version: '1.0',
      display_mode: 'transition',
      result: 'issues',
      observed_on: '2026-01-01',
    },
  };
}
const key = () => randomBytes(32).toString('hex');

test('usage reports stay private until review; approval and withdrawal preserve official support', async () => {
  const db = await connect();
  try {
    const { actor, app, storeId } = await setup(db);
    const initial = (
      await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id])
    ).rows[0];
    const history = (
      await db.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id])
    ).rows;
    const image = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#ffffff' },
    })
      .webp()
      .toBuffer();
    const report = { ...input(storeId), screenshot_base64: image.toString('base64') };
    const visitor = key();
    for (let i = 0; i < 2; i++)
      await asActor(db, null, (db) =>
        db.query('SELECT submission_ingress.accept($1,$2)', [report, visitor]),
      );
    const items = (
      await db.query('SELECT * FROM app_private.review_items WHERE app_id=$1', [app.id])
    ).rows;
    assert.equal(items.length, 1);
    const item = items[0];
    assert.equal(item.candidate_payload.has_screenshot, true);
    assert.equal(item.candidate_payload.usage.environment, 'simulator');
    assert.equal('screenshot_base64' in item.candidate_payload, false);
    assert.ok(JSON.stringify(item.candidate_payload).length < 2000);
    for (const identity of [null, randomUUID()]) {
      await asActor(db, identity, async (db) => {
        assert.equal(
          (await db.query('SELECT * FROM public.usage_reports WHERE id=$1', [item.submission_id]))
            .rowCount,
          0,
        );
        assert.equal(
          (
            await db.query('SELECT * FROM public.usage_report_images WHERE report_id=$1', [
              item.submission_id,
            ])
          ).rowCount,
          0,
        );
      });
      if (identity === null)
        await assert.rejects(
          asActor(db, identity, (db) =>
            db.query('SELECT * FROM app_private.submission_screenshots'),
          ),
          { code: '42501' },
        );
      else
        await asActor(db, identity, async (db) =>
          assert.equal(
            (await db.query('SELECT * FROM app_private.submission_screenshots')).rowCount,
            0,
          ),
        );
      await assert.rejects(
        asActor(db, identity, (db) =>
          db.query('SELECT app_private.decide_review($1,1,$2,$3,$4)', [
            item.id,
            'approved',
            'Forged approval',
            app.revision,
          ]),
        ),
        { code: '42501' },
      );
    }
    await asActor(db, actor, async (db) =>
      assert.deepEqual(
        (
          await db.query(
            'SELECT bytes FROM app_private.submission_screenshots WHERE submission_id=$1',
            [item.submission_id],
          )
        ).rows[0].bytes,
        image,
      ),
    );
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.decide_review($1,1,$2,$3,NULL)', [
        item.id,
        'deferred',
        'Private moderation note',
      ]),
    );
    app.revision = (
      await db.query('SELECT revision FROM app_private.apps WHERE id=$1', [app.id])
    ).rows[0].revision;
    await assert.rejects(
      asActor(db, actor, (db) =>
        db.query('SELECT app_private.decide_review($1,1,$2,$3,$4)', [
          item.id,
          'approved',
          'Stale decision',
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
          'Stale app revision',
          app.revision + 1,
        ]),
      ),
      { code: '40001' },
    );
    await db.query(`CREATE FUNCTION app_private.fail_usage_review_test() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.state='approved' THEN RAISE EXCEPTION 'Injected final write failure'; END IF; RETURN NEW; END $$`);
    await db.query(
      'CREATE TRIGGER fail_usage_review_test BEFORE UPDATE ON app_private.review_items FOR EACH ROW EXECUTE FUNCTION app_private.fail_usage_review_test()',
    );
    await assert.rejects(
      asActor(db, actor, (db) =>
        db.query('SELECT app_private.decide_review($1,2,$2,$3,$4)', [
          item.id,
          'approved',
          'Test atomic publish',
          app.revision,
        ]),
      ),
    );
    assert.equal(
      (await db.query('SELECT * FROM public.usage_reports WHERE id=$1', [item.submission_id]))
        .rowCount,
      0,
    );
    assert.equal(
      (
        await db.query('SELECT * FROM public.usage_report_images WHERE report_id=$1', [
          item.submission_id,
        ])
      ).rowCount,
      0,
    );
    await db.query('DROP TRIGGER fail_usage_review_test ON app_private.review_items');
    await db.query('DROP FUNCTION app_private.fail_usage_review_test()');
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.decide_review($1,2,$2,$3,$4)', [
        item.id,
        'approved',
        'Reviewed consent and screenshot privacy',
        app.revision,
      ]),
    );
    await asActor(db, null, async (db) => {
      const published = (
        await db.query('SELECT * FROM public.usage_reports WHERE id=$1', [item.submission_id])
      ).rows[0];
      assert.equal(published.body, report.body);
      assert.equal(published.locale, 'en');
      assert.equal(published.usage.result, 'issues');
      assert.equal('reason' in published, false);
      assert.equal('actor' in published, false);
      assert.deepEqual(
        (
          await db.query('SELECT bytes FROM public.usage_report_images WHERE report_id=$1', [
            item.submission_id,
          ])
        ).rows[0].bytes,
        image,
      );
    });
    assert.deepEqual(
      (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id])).rows[0],
      initial,
    );
    assert.deepEqual(
      (await db.query('SELECT * FROM public.support_history WHERE app_id=$1', [app.id])).rows,
      history,
    );
    await db.query("UPDATE public.directory_entries SET publication='archived' WHERE app_id=$1", [
      app.id,
    ]);
    await asActor(db, null, async (db) => {
      assert.equal(
        (await db.query('SELECT * FROM public.usage_reports WHERE id=$1', [item.submission_id]))
          .rowCount,
        0,
      );
      assert.equal(
        (
          await db.query('SELECT * FROM public.usage_report_images WHERE report_id=$1', [
            item.submission_id,
          ])
        ).rowCount,
        0,
      );
    });
    await db.query("UPDATE public.directory_entries SET publication='published' WHERE app_id=$1", [
      app.id,
    ]);
    await assert.rejects(
      asActor(db, randomUUID(), (db) =>
        db.query('SELECT app_private.withdraw_usage_report($1,3,$2)', [
          item.submission_id,
          'Forged withdrawal',
        ]),
      ),
      { code: '42501' },
    );
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.withdraw_usage_report($1,3,$2)', [
        item.submission_id,
        'Withdraw privacy-sensitive report',
      ]),
    );
    assert.equal(
      (await db.query('SELECT * FROM public.usage_reports WHERE id=$1', [item.submission_id]))
        .rowCount,
      0,
    );
    assert.equal(
      (
        await db.query('SELECT * FROM public.usage_report_images WHERE report_id=$1', [
          item.submission_id,
        ])
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await db.query('SELECT * FROM app_private.submission_screenshots WHERE submission_id=$1', [
          item.submission_id,
        ])
      ).rowCount,
      1,
    );
    assert.equal(
      (await db.query('SELECT state FROM app_private.review_items WHERE id=$1', [item.id])).rows[0]
        .state,
      'rejected',
    );
    assert.deepEqual(
      (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id])).rows[0],
      initial,
    );
  } finally {
    await db.end();
  }
});

test('usage intake validates consent, devices, dates, images, published scope and rate limits in SQL', async () => {
  const db = await connect();
  try {
    const { app, storeId } = await setup(db);
    const valid = input(storeId);
    const variants = [
      { ...valid, publish_consent: false },
      { ...valid, locale: 'ja' },
      { ...valid, app_store_id: '1' },
      { ...valid, app_store_id: '2', store_url: 'https://apps.apple.com/kr/app/id2' },
      { ...valid, usage: null },
      { ...valid, usage: { ...valid.usage, environment: 'assumed' } },
      { ...valid, usage: { ...valid.usage, observed_on: '2026-02-30' } },
      { ...valid, usage: { ...valid.usage, observed_on: '2999-01-01' } },
      { ...valid, usage: { ...valid.usage, app_version: '' } },
      { ...valid, screenshot_base64: Buffer.from('not an image').toString('base64') },
      { ...valid, screenshot_base64: 'x'.repeat(1398108) },
      { ...valid, evidence_url: 'https://user:pass@example.com/private' },
    ];
    for (const invalid of variants)
      await assert.rejects(
        asActor(db, null, (db) =>
          db.query('SELECT submission_ingress.accept($1,$2)', [invalid, key()]),
        ),
        { code: '23514' },
      );
    await db.query("UPDATE public.directory_entries SET publication='archived' WHERE app_id=$1", [
      app.id,
    ]);
    await assert.rejects(
      asActor(db, null, (db) =>
        db.query('SELECT submission_ingress.accept($1,$2)', [valid, key()]),
      ),
      { code: '23514' },
    );
    await db.query("UPDATE public.directory_entries SET publication='published' WHERE app_id=$1", [
      app.id,
    ]);
    const visitor = key();
    for (let i = 0; i < 5; i++)
      await asActor(db, null, (db) =>
        db.query('SELECT submission_ingress.accept($1,$2)', [valid, visitor]),
      );
    await assert.rejects(
      asActor(db, null, (db) =>
        db.query('SELECT submission_ingress.accept($1,$2)', [valid, visitor]),
      ),
      { code: 'P0429' },
    );
    const item = (
      await db.query('SELECT * FROM app_private.review_items WHERE app_id=$1', [app.id])
    ).rows[0];
    assert.equal(item.candidate_payload.has_screenshot, false);
    assert.equal(
      (await db.query('SELECT * FROM public.usage_reports WHERE app_id=$1', [app.id])).rowCount,
      0,
    );
    await asActor(db, null, async (db) =>
      assert.equal(
        (
          await db.query('SELECT * FROM public.usage_report_images WHERE report_id=$1', [
            item.submission_id,
          ])
        ).rowCount,
        0,
      ),
    );
  } finally {
    await db.end();
  }
});
