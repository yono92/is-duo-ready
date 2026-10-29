import { Pool } from 'pg';
import { localDatabaseUrl } from './lib/database.mjs';
import { withActor } from '../src/lib/db/transaction.mjs';
import { runCollection } from '../src/lib/collection/worker.mjs';

let pool;
try {
  const args = process.argv.slice(2);
  if (
    args.some((arg) => arg !== '--watch') ||
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV === 'production'
  )
    throw new Error();
  const url = localDatabaseUrl();
  if (
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV === 'production' ||
    process.env.LOCAL_ADMIN_AUTH !== 'true' ||
    !/^[a-f0-9-]{36}$/i.test(process.env.LOCAL_ADMIN_USER_ID ?? '')
  )
    throw new Error();
  pool = new Pool({
    connectionString: url.toString(),
    max: 3,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  });
  pool.on('error', () => {});
  let stopping = false;
  const controller = new AbortController();
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => {
      stopping = true;
      controller.abort();
    });
  const { setTimeout: delay } = await import('node:timers/promises');
  do {
    let processed = 0;
    for (let i = 0; i < 5 && !stopping; i++) {
      const result = await runCollection(
        (actor, operation) => withActor(pool, actor, operation),
        process.env.LOCAL_ADMIN_USER_ID,
      );
      if (result.state === 'idle') break;
      processed++;
      console.log(`Collection ${result.state}${result.error ? ': ' + result.error : ''}.`);
    }
    console.log(`Batch complete: ${processed} target(s).`);
    if (!args.includes('--watch') || stopping) break;
    await delay(60000, undefined, { signal: controller.signal }).catch(() => {});
  } while (!stopping);
} catch {
  console.error(
    'Local collection could not run. Check local database, migrations and enabled local admin configuration.',
  );
  process.exitCode = 1;
} finally {
  await pool?.end();
}
