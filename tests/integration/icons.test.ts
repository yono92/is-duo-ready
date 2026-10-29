import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { connect, asActor } from './helpers.ts';
import { collectIcon, localIconStorage } from '../../src/lib/icons/storage.ts';

test('icons preserve old assets on failed refresh and enforce draft/published/archive RLS', async () => {
  const db = await connect();
  const actor = randomUUID();
  const dir = await mkdtemp(join(tmpdir(), 'duo-icon-db-'));
  const storage = localIconStorage({ APP_ICON_STORAGE_DIR: dir });
  const source = 'https://is1-ssl.mzstatic.com/image/thumb/fictional/icon.png';
  const bytes = await sharp({
    create: { width: 48, height: 48, channels: 4, background: '#abcdef' },
  })
    .png()
    .toBuffer();
  const fetcher = async () => new Response(bytes);
  try {
    await db.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
    const app = await asActor(
      db,
      actor,
      async (db) =>
        (
          await db.query('SELECT app_private.import_app($1,$2) AS app', [
            {
              app_store_id: '990008001',
              name: 'Fictional stored icon',
              developer: 'Test only',
              category: 'productivity',
              icon_url: source,
              fetched_at: new Date().toISOString(),
            },
            {},
          ])
        ).rows[0].app,
    );
    await asActor(db, actor, async (db) => {
      assert.equal(await collectIcon(db, app.id, source, { storage, fetcher }), 'stored');
      const before = (
        await db.query('SELECT * FROM public.app_icon_assets WHERE app_id=$1', [app.id])
      ).rows[0];
      assert.deepEqual(await storage.read(before.storage_path), bytes);
      assert.equal(
        await collectIcon(db, app.id, source, {
          storage,
          fetcher: async () => {
            throw new Error('Offline');
          },
        }),
        'failed',
      );
      assert.deepEqual(
        (await db.query('SELECT * FROM public.app_icon_assets WHERE app_id=$1', [app.id])).rows[0],
        before,
      );
      assert.equal(
        await collectIcon(db, app.id, source + '?old=1', { storage, fetcher }),
        'superseded',
      );
    });
    for (const visitor of [null, randomUUID()])
      await asActor(db, visitor, async (db) => {
        assert.equal(
          (await db.query('SELECT * FROM public.app_icon_assets WHERE app_id=$1', [app.id]))
            .rowCount,
          0,
        );
      });
    await assert.rejects(
      asActor(db, randomUUID(), (db) =>
        db
          .query('DELETE FROM public.app_icon_assets WHERE app_id=$1 RETURNING *', [app.id])
          .then((r) => {
            if (!r.rowCount) throw new Error('No authorized row');
          }),
      ),
    );
    const published = await asActor(db, actor, async (db) => {
      const saved = (
        await db.query('SELECT app_private.save_app($1,$2) AS app', [
          {
            ...app,
            app_store_id: '990008001',
            slug: 'fictional-stored-icon',
            name: 'Fictional stored icon',
            developer: 'Test only',
            category: 'productivity',
            status: 'unknown',
            investigation_reason: 'Test only, no real claim',
            translations: {
              ko: { name: 'Fictional stored icon', summary: 'Test only', state: 'current' },
            },
            evidence: [],
          },
          1,
        ])
      ).rows[0].app;
      return (
        await db.query('SELECT app_private.publish_app($1,$2,$3) AS app', [
          saved.id,
          saved.revision,
          'Test only',
        ])
      ).rows[0].app;
    });
    await asActor(db, null, async (db) =>
      assert.equal(
        (await db.query('SELECT * FROM public.app_icon_assets WHERE app_id=$1', [app.id])).rowCount,
        1,
      ),
    );
    await asActor(db, actor, (db) =>
      db.query('SELECT app_private.archive_app($1,$2,$3)', [
        app.id,
        published.revision,
        'Test archive',
      ]),
    );
    await asActor(db, null, async (db) =>
      assert.equal(
        (await db.query('SELECT * FROM public.app_icon_assets WHERE app_id=$1', [app.id])).rowCount,
        0,
      ),
    );
  } finally {
    await db.end();
    await rm(dir, { recursive: true, force: true });
  }
});
