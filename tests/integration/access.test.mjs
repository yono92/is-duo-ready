import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connect, asActor } from './helpers.mjs';

test('actual non-owner policies deny visitors and ordinary users, allow current admins', async () => {
  const client = await connect();
  const admin = randomUUID();
  const ordinary = randomUUID();
  try {
    await client.query('INSERT INTO app_private.admin_users (user_id) VALUES ($1)', [admin]);
    await asActor(client, admin, async (db) => {
      const role = await db.query('SELECT current_user');
      assert.equal(role.rows[0].current_user, 'authenticated');
      await db.query(`INSERT INTO app_private.apps (app_store_id, slug, name, developer)
        VALUES ('990000000001', 'test-private-draft', 'Fictional policy test', 'Test only')`);
    });
    await assert.rejects(
      asActor(client, null, (db) => db.query('SELECT * FROM app_private.apps')),
      { code: '42501' },
    );
    await asActor(client, ordinary, async (db) => {
      assert.equal((await db.query('SELECT * FROM app_private.apps')).rowCount, 0);
      assert.equal((await db.query('SELECT * FROM app_private.admin_users')).rowCount, 0);
    });
    await assert.rejects(
      asActor(client, ordinary, (db) =>
        db.query('INSERT INTO app_private.admin_users (user_id) VALUES ($1)', [ordinary]),
      ),
      { code: '42501' },
    );
    await assert.rejects(
      asActor(client, ordinary, (db) =>
        db.query(`INSERT INTO app_private.apps (app_store_id, slug, name, developer)
          VALUES ('990000000002', 'forbidden-test', 'Fictional', 'Test only')`),
      ),
      { code: '42501' },
    );
    await asActor(client, null, async (db) => {
      assert.equal((await db.query('SELECT * FROM public.directory_entries')).rowCount, 0);
      assert.equal((await db.query('SELECT * FROM public.support_history')).rowCount, 0);
    });
    await client.query('UPDATE app_private.admin_users SET enabled = false WHERE user_id = $1', [
      admin,
    ]);
    await asActor(client, admin, async (db) => {
      assert.equal((await db.query('SELECT * FROM app_private.apps')).rowCount, 0);
      assert.equal(
        (await db.query('SELECT app_private.is_admin() AS allowed')).rows[0].allowed,
        false,
      );
    });
    const identity = await client.query(
      "SELECT current_user, current_setting('request.jwt.claims', true) AS claims",
    );
    assert.notEqual(identity.rows[0].current_user, 'authenticated');
    assert.ok(!identity.rows[0].claims);
  } finally {
    await client.end();
  }
});

test('every application table has RLS and public history cannot be updated or deleted', async () => {
  const client = await connect();
  try {
    const tables = await client.query(`SELECT n.nspname, c.relname, c.relrowsecurity
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE c.relkind='r' AND (n.nspname='app_private' OR
        (n.nspname='public' AND c.relname IN ('directory_entries','support_history')))`);
    assert.ok(tables.rowCount >= 13);
    assert.ok(tables.rows.every((row) => row.relrowsecurity));
    const rights = await client.query(`SELECT
      has_table_privilege('authenticated','public.support_history','UPDATE') AS can_update,
      has_table_privilege('authenticated','public.support_history','DELETE') AS can_delete,
      has_table_privilege('anon','public.directory_entries','INSERT') AS public_insert`);
    assert.deepEqual(rights.rows[0], {
      can_update: false,
      can_delete: false,
      public_insert: false,
    });
  } finally {
    await client.end();
  }
});
