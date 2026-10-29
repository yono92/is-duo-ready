import { Pool } from 'pg';
import { localDatabaseUrl } from './lib/database.mjs';
import { withActor } from '../src/lib/db/transaction.mjs';
import { collectIcon, localIconStorage } from '../src/lib/icons/storage.mjs';

let pool;
try {
  pool = new Pool({ connectionString: localDatabaseUrl(), max: 1, connectionTimeoutMillis: 5000 });
  pool.on('error', () => {});
  if (
    process.env.LOCAL_ADMIN_AUTH !== 'true' ||
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL !== undefined
  )
    throw new Error('This command requires the configured local development administrator.');
  const actor = process.env.LOCAL_ADMIN_USER_ID;
  const storage = localIconStorage();
  const apps = await withActor(pool, actor, async (db) => {
    if (!(await db.query('SELECT app_private.is_admin() AS ok')).rows[0].ok)
      throw new Error('Administrator required.');
    return (
      await db.query(`SELECT a.id,l.icon_url,i.storage_path,i.source_url FROM app_private.apps a
      JOIN app_private.app_store_listings l ON l.app_id=a.id AND l.country='KR'
      LEFT JOIN public.app_icon_assets i ON i.app_id=a.id WHERE l.icon_url IS NOT NULL ORDER BY a.id`)
    ).rows;
  });
  const counts = { stored: 0, skipped: 0, failed: 0, superseded: 0, missing: 0 };
  for (const [index, app] of apps.entries()) {
    if (
      !process.argv.includes('--refresh') &&
      app.storage_path &&
      app.source_url === app.icon_url
    ) {
      try {
        await storage.read(app.storage_path);
        counts.skipped++;
        continue;
      } catch {
        /* Repair missing/corrupt files. */
      }
    }
    const status = await withActor(pool, actor, (db) =>
      collectIcon(db, app.id, app.icon_url, { storage }),
    );
    counts[status]++;
    console.log(`Icon ${index + 1}/${apps.length}: ${status}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  console.log(JSON.stringify(counts));
  if (counts.failed) process.exitCode = 1;
} catch {
  console.error(
    'Icon sync failed. Check local DB, migrations and storage access; private details suppressed.',
  );
  process.exitCode = 1;
} finally {
  await pool?.end();
}
