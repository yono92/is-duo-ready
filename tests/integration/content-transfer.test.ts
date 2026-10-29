import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connect } from './helpers.ts';
import { databaseClient, applyMigrations } from '../../scripts/lib/database.ts';
import {
  contentSnapshot,
  transferContent,
  rowsHash,
  contentTables,
} from '../../scripts/lib/content-transfer.ts';

test('content transfer preserves actual records, rolls back late failures and refuses conflicting replay', async () => {
  const source = await connect();
  const name = `duo_test_${randomUUID().replaceAll('-', '')}`;
  let target;
  let created = false;
  try {
    const id = randomUUID();
    await source.query(
      "INSERT INTO app_private.apps(id,app_store_id,slug,name,developer) VALUES($1,'99008881122','transfer-fixture','Transfer test','Test only')",
      [id],
    );
    await source.query(
      "INSERT INTO app_private.app_translations(app_id,locale,name,summary) VALUES($1,'en','Transfer test','Isolated test content')",
      [id],
    );
    const snapshot = await contentSnapshot(source);
    assert.ok(
      snapshot.tables['app_private.apps'].length > 0,
      'Earlier isolated tests provide nonempty provenance',
    );
    assert.ok(!contentTables.includes('app_private.admin_users'));
    await source.query(`CREATE DATABASE ${name}`);
    created = true;
    const url = new URL(process.env.DUO_TEST_DATABASE_URL!);
    url.pathname = `/${name}`;
    target = databaseClient(url.toString());
    await target.connect();
    await applyMigrations(target);
    assert.equal((await transferContent(target, snapshot)).status, 'dry-run');
    assert.equal((await target.query('SELECT count(*)::int n FROM app_private.apps')).rows[0].n, 0);
    await target.query(`CREATE FUNCTION app_private.transfer_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'test rollback'; END$$;
      CREATE TRIGGER transfer_test_fail BEFORE INSERT ON app_private.app_translations FOR EACH ROW EXECUTE FUNCTION app_private.transfer_test_fail()`);
    await assert.rejects(transferContent(target, snapshot, true));
    assert.equal((await target.query('SELECT count(*)::int n FROM app_private.apps')).rows[0].n, 0);
    await target.query(
      'DROP TRIGGER transfer_test_fail ON app_private.app_translations; DROP FUNCTION app_private.transfer_test_fail()',
    );
    assert.equal((await transferContent(target, snapshot, true)).status, 'copied');
    assert.equal((await transferContent(target, snapshot, true)).status, 'identical');
    const after = await contentSnapshot(target);
    for (const table of contentTables)
      assert.equal(rowsHash(after.tables[table]), rowsHash(snapshot.tables[table]));
    assert.equal(
      (await target.query('SELECT count(*)::int n FROM app_private.admin_users')).rows[0].n,
      0,
    );
    const changed = structuredClone(snapshot);
    changed.tables['app_private.apps'][0].name = 'conflicting copy';
    await assert.rejects(transferContent(target, changed, true), /not empty or identical/);
    assert.equal(
      rowsHash((await contentSnapshot(target)).tables['app_private.apps']),
      rowsHash(snapshot.tables['app_private.apps']),
    );
  } finally {
    await target?.end();
    if (created) await source.query(`DROP DATABASE ${name} WITH (FORCE)`);
    await source.end();
  }
});
