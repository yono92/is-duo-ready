import type { Pool, PoolClient } from 'pg';
// This module is imported only through the server-only database entrypoint.
// The actor is derived from a verified server session, never from form input.
export async function withActor<T>(
  pool: Pool,
  actor: string | null,
  operation: (db: PoolClient) => T | Promise<T>,
): Promise<T> {
  if (actor !== null && !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(actor)) {
    throw new Error('Invalid verified identity.');
  }
  const client = await pool.connect();
  let broken = false;
  try {
    await client.query('BEGIN');
    await client.query(actor ? 'SET LOCAL ROLE authenticated' : 'SET LOCAL ROLE anon');
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(actor ? { sub: actor, role: 'authenticated' } : { role: 'anon' }),
    ]);
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      broken = true;
    }
    throw error;
  } finally {
    client.release(broken);
  }
}
