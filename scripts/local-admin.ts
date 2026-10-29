import { randomBytes, randomUUID } from 'node:crypto';
import { open, readFile, rename, unlink } from 'node:fs/promises';
import { localDatabaseUrl, databaseClient } from './lib/database.ts';

// Explicit local bootstrap only. It cannot create a hosted user or grant an arbitrary supplied UUID.
let client, lock, temp;
try {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL !== undefined) throw new Error();
  const connection = localDatabaseUrl();
  lock = await open('.env.local.admin.lock', 'wx', 0o600);
  const original = await readFile('.env.local', 'utf8');
  if (/^\s*(?:LOCAL_ADMIN_[A-Z_]+|DIRECTORY_DATA_SOURCE)\s*=/m.test(original)) {
    console.error('Local admin or directory mode is already configured; no settings were changed.');
    process.exitCode = 1;
  } else {
    const actor = randomUUID();
    const password = randomBytes(24).toString('base64url');
    client = databaseClient(connection);
    await client.connect();
    await client.query('BEGIN');
    await client.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
    temp = `.env.local.admin-${randomUUID()}.tmp`;
    const file = await open(temp, 'wx', 0o600);
    try {
      await file.writeFile(
        `${original.trimEnd()}\n\n# Explicit local development only. Never copy these credentials to hosted environments.\nDIRECTORY_DATA_SOURCE=postgres\nLOCAL_ADMIN_AUTH=true\nLOCAL_ADMIN_USER_ID=${actor}\nLOCAL_ADMIN_EMAIL=admin@duo-ready.local\nLOCAL_ADMIN_PASSWORD=${password}\n`,
      );
      await file.sync();
    } finally {
      await file.close();
    }
    // Refuse a concurrent user edit rather than replacing it.
    if ((await readFile('.env.local', 'utf8')) !== original) throw new Error();
    await client.query('COMMIT');
    try {
      await rename(temp, '.env.local');
      temp = undefined;
    } catch (error) {
      await client.query('DELETE FROM app_private.admin_users WHERE user_id=$1', [actor]);
      throw error;
    }
    console.log(
      'Local administrator configured. Credentials are in private .env.local; no secret was printed. Restart the dev server and open /ko/admin/login.',
    );
  }
} catch {
  await client?.query('ROLLBACK').catch(() => {});
  console.error(
    'Local admin setup failed. Check local PostgreSQL configuration, apply migrations first, and preserve existing settings.',
  );
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => {});
  if (temp) await unlink(temp).catch(() => {});
  if (lock) {
    await lock.close();
    await unlink('.env.local.admin.lock');
  }
}
