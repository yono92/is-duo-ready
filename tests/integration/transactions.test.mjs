import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { connect } from './helpers.mjs';
import { withActor } from '../../src/lib/db/transaction.mjs';

test('the production transaction wrapper clears identity and rolls back failed writes on pool reuse', async () => {
  const setup = await connect();
  const admin = randomUUID();
  const ordinary = randomUUID();
  await setup.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [admin]);
  await setup.end();
  const pool = new Pool({ connectionString: process.env.DUO_TEST_DATABASE_URL, max: 1 });
  try {
    await assert.rejects(
      withActor(pool, admin, async (db) => {
        await db.query(`INSERT INTO app_private.apps(app_store_id,slug,name,developer)
        VALUES('990000000099','transaction-test','Fictional rollback','Test only')`);
        throw new Error('intentional failure');
      }),
      /intentional failure/,
    );
    await withActor(pool, admin, async (db) => {
      assert.equal(
        (await db.query("SELECT * FROM app_private.apps WHERE slug='transaction-test'")).rowCount,
        0,
      );
      assert.equal((await db.query('SELECT app_private.is_admin() AS yes')).rows[0].yes, true);
    });
    await withActor(pool, ordinary, async (db) => {
      assert.equal((await db.query('SELECT app_private.is_admin() AS yes')).rows[0].yes, false);
    });
    await withActor(pool, null, async (db) => {
      assert.equal((await db.query('SELECT current_user')).rows[0].current_user, 'anon');
      assert.equal(
        (await db.query("SELECT * FROM public.directory_entries WHERE slug='transaction-test'"))
          .rowCount,
        0,
      );
    });
    const clean = await pool.query(
      "SELECT current_user, current_setting('request.jwt.claims', true) AS claims",
    );
    assert.notEqual(clean.rows[0].current_user, 'anon');
    assert.ok(!clean.rows[0].claims);
    await assert.rejects(
      withActor(pool, 'not-a-verified-uuid', () => {}),
      /Invalid verified identity/,
    );
  } finally {
    await pool.end();
  }
});
