import { Client } from 'pg';
import assert from 'node:assert/strict';

export async function connect() {
  const url = new URL(process.env.DUO_TEST_DATABASE_URL ?? 'http://invalid');
  assert.match(url.pathname, /^\/duo_test_[a-f0-9]{32}$/);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  return client;
}

export async function asActor(client, actor, callback) {
  await client.query('BEGIN');
  try {
    await client.query(actor ? 'SET LOCAL ROLE authenticated' : 'SET LOCAL ROLE anon');
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(actor ? { sub: actor, role: 'authenticated' } : { role: 'anon' }),
    ]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
