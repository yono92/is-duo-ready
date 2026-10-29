import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { hostedArguments, loadHosted } from './lib/hosted.ts';
import { connectionOptions } from '../src/lib/db/connection.ts';
import { withActor } from '../src/lib/db/transaction.ts';
import { verifiedSessionId, liveHostedSession } from '../src/lib/admin/hosted-session.ts';
let pool, admin, userId;
try {
  const args = hostedArguments();
  if (args.target !== 'preview' || !args.apply)
    throw Error('Disposable identity tests require explicit Preview --apply.');
  const env = loadHosted(args);
  pool = new Pool({
    ...connectionOptions(env.DATABASE_URL),
    max: 2,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  });
  pool.on('error', () => {});
  const options = {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  };
  admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, options);
  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  const email = `duo-preview-test-${randomUUID()}@example.invalid`,
    password = randomBytes(32).toString('base64url');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw Error('Identity creation failed');
  userId = created.data.user.id;
  const login = await client.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null);
  const token = login.data.session.access_token;
  const verified = await client.auth.getUser(token);
  assert.equal(verified.data.user?.id, userId);
  const sessionId = verifiedSessionId(token, userId);
  assert.ok(sessionId);
  assert.equal(await liveHostedSession(pool, sessionId, userId), true);
  await withActor(pool, userId, async (db) => {
    assert.equal(
      (await db.query('SELECT app_private.is_admin() AS allowed')).rows[0].allowed,
      false,
    );
    assert.equal((await db.query('SELECT * FROM app_private.apps')).rowCount, 0);
  });
  await pool.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [userId]);
  await withActor(pool, userId, async (db) => {
    assert.equal(
      (await db.query('SELECT app_private.is_admin() AS allowed')).rows[0].allowed,
      true,
    );
    assert.equal((await db.query('SELECT count(*)::int n FROM app_private.apps')).rows[0].n, 128);
  });
  await pool.query('UPDATE app_private.admin_users SET enabled=false WHERE user_id=$1', [userId]);
  await withActor(pool, userId, async (db) =>
    assert.equal((await db.query('SELECT * FROM app_private.apps')).rowCount, 0),
  );
  await withActor(pool, null, async (db) => {
    assert.equal((await db.query('SELECT * FROM public.directory_entries')).rowCount, 0);
    assert.equal((await db.query('SELECT * FROM public.app_icon_assets')).rowCount, 0);
  });
  const refreshed = await client.auth.refreshSession();
  assert.equal(refreshed.error, null);
  assert.ok(refreshed.data.session);
  assert.equal(verifiedSessionId(refreshed.data.session.access_token, userId), sessionId);
  assert.equal((await client.auth.signOut()).error, null);
  assert.equal(await liveHostedSession(pool, sessionId, userId), false);
  const asset = (await pool.query('SELECT storage_path FROM public.app_icon_assets LIMIT 1'))
    .rows[0];
  const publicRead = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${asset.storage_path}`,
    { signal: AbortSignal.timeout(8000) },
  );
  assert.ok(publicRead.status >= 400);
  console.log(
    'PASS Preview: provider login/getUser/refresh/logout/replayed-session denial; ordinary/admin/revoked/anon RLS; private bucket denies public URL.',
  );
} catch (e) {
  console.error('Hosted verification failed; private details suppressed.');
  if (
    e instanceof Error &&
    'code' in e &&
    typeof e.code === 'string' &&
    /^[A-Z0-9_]+$/.test(e.code)
  )
    console.error(e.code);
  process.exitCode = 1;
} finally {
  if (userId && pool && admin) {
    try {
      await pool.query('DELETE FROM app_private.admin_users WHERE user_id=$1', [userId]);
      const result = await admin.auth.admin.deleteUser(userId);
      if (result.error) throw Error('cleanup');
      console.log('Disposable Preview identity removed.');
    } catch {
      console.error('Disposable identity cleanup needs attention.');
      process.exitCode = 1;
    }
  }
  await pool?.end();
}
