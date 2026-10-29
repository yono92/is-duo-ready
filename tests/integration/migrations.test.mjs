import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, appendFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect } from './helpers.mjs';
import { applyMigrations } from '../../scripts/lib/database.mjs';

test('migration replay is inert, changed history is rejected, failed DDL rolls back', async () => {
  const client = await connect();
  const temp = await mkdtemp(join(tmpdir(), 'duo-migration-test-'));
  try {
    assert.deepEqual(await applyMigrations(client), []);
    await cp('db/migrations', temp, { recursive: true });
    const first = (await client.query('SELECT name FROM duo_migrations.history ORDER BY name'))
      .rows[0].name;
    await appendFile(join(temp, first), '\n-- unauthorized historical modification\n');
    await assert.rejects(applyMigrations(client, temp), /applied migration changed/);
    await cp('db/migrations', temp, { recursive: true });
    await writeFile(
      join(temp, '999_rollback_test.sql'),
      'CREATE TABLE public.should_rollback(id integer); SELECT definitely_not_a_function();',
    );
    await assert.rejects(applyMigrations(client, temp), { code: '42883' });
    assert.equal(
      (await client.query("SELECT to_regclass('public.should_rollback') AS name")).rows[0].name,
      null,
    );
    assert.equal(
      (
        await client.query(
          "SELECT 1 FROM duo_migrations.history WHERE name='999_rollback_test.sql'",
        )
      ).rowCount,
      0,
    );
    assert.deepEqual(await applyMigrations(client), []);
  } finally {
    await client.end();
    await rm(temp, { recursive: true, force: true });
  }
});
