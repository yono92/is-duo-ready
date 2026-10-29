import { hostedArguments, loadHosted } from './lib/hosted.ts';
import { databaseClient, applyMigrations } from './lib/database.ts';
import { supabaseIconStorage } from '../src/lib/icons/hosted.ts';

let db;
try {
  const args = hostedArguments();
  const env = loadHosted(args);
  if (args.apply && new URL(env.DATABASE_URL).port === '6543')
    throw new Error('Migrations require a direct or session-pool connection for advisory locks.');
  db = databaseClient(env.DATABASE_URL);
  await db.connect();
  const tls = await db.query('SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()');
  if (!tls.rows[0]?.ssl) throw new Error('Hosted database TLS is required.');
  if (args.apply) {
    const applied = await applyMigrations(db);
    await supabaseIconStorage(env).ensureBucket();
    console.log(JSON.stringify({ target: args.target, applied, privateBucket: 'verified' }));
  } else
    console.log('PASS hosted configuration and TLS. Dry-run: no migrations or bucket changes.');
} catch {
  // Provider/SQL errors may include connection or row data. Show only our safe config errors.
  console.error(
    'Hosted setup failed. Check private configuration, TLS, migrations and bucket permissions.',
  );
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}
