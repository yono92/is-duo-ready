import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connect, asActor } from './helpers.ts';

export function draftPayload(suffix: string) {
  return {
    id: undefined as string | undefined,
    app_store_id: `99001${suffix}`,
    slug: `fictional-draft-${suffix}`,
    name: 'Fictional test app',
    developer: 'Test only',
    category: 'productivity',
    aliases: ['가상 검증 앱'],
    original_locale: 'ko',
    translations: {
      ko: { name: '가상 검증 앱', summary: '테스트 전용 원문', state: 'current' },
      en: { name: 'Fictional test app', summary: 'Test only translation', state: 'current' },
    },
    current_version: '2.0',
    status: 'unknown',
    investigation_reason: 'Test only investigation',
    evidence: [],
  };
}

test('draft save is private, validates unique IDs, detects stale edits and marks translations stale', async () => {
  const client = await connect();
  const admin = randomUUID();
  try {
    await client.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [admin]);
    const payload = draftPayload('1001');
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
    const app = await save(payload);
    assert.equal(app.revision, 1);
    await asActor(client, null, async (db) => {
      assert.equal(
        (await db.query('SELECT * FROM public.directory_entries WHERE app_id=$1', [app.id]))
          .rowCount,
        0,
      );
    });
    await assert.rejects(save({ ...payload, slug: 'different-slug' }), { code: '23505' });
    const edited = structuredClone(payload);
    edited.id = app.id;
    edited.translations.ko.summary = '새 테스트 원문';
    const next = await save(edited, app.revision);
    assert.equal(next.revision, 2);
    await asActor(client, admin, async (db) => {
      const translation = await db.query(
        "SELECT state FROM app_private.app_translations WHERE app_id=$1 AND locale='en'",
        [app.id],
      );
      assert.equal(translation.rows[0].state, 'needs-review');
    });
    await assert.rejects(save(edited, app.revision), { code: '40001' });
    edited.slug = 'renamed-fictional-test';
    await save(edited, next.revision);
    await assert.rejects(save({ ...draftPayload('1002'), slug: payload.slug }), { code: '23505' });
    await assert.rejects(save({ ...draftPayload('1003'), aliases: [null] }), { code: '23514' });
  } finally {
    await client.end();
  }
});
