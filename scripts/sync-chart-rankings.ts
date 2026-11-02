import { readFile } from 'node:fs/promises';
import { databaseClient, localDatabaseUrl } from './lib/database.ts';
import { hostedArguments, loadHosted } from './lib/hosted.ts';
import { syncChartRankings } from './lib/chart-rankings.ts';

let db;
try {
  const raw = process.argv.slice(2);
  const hosted = raw.some((arg) => arg.startsWith('--target='));
  const args = hosted ? hostedArguments(raw) : null;
  if (
    !hosted &&
    (raw.some((arg) => arg !== '--apply' && !/^--source=.+\.json$/.test(arg)) ||
      raw.filter((arg) => arg.startsWith('--source=')).length !== 1 ||
      raw.filter((arg) => arg === '--apply').length > 1)
  )
    throw new Error('Use --source=manifest.json [--apply] for local data.');
  const source = args?.source ?? raw.find((arg) => arg.startsWith('--source='))?.slice(9);
  if (!source) throw new Error('A chart manifest is required.');
  const input: unknown = JSON.parse(await readFile(source, 'utf8'));
  db = databaseClient(args ? loadHosted(args).DATABASE_URL : localDatabaseUrl());
  await db.connect();
  await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
  const charts = await syncChartRankings(db, input);
  const apply = args?.apply ?? raw.includes('--apply');
  await db.query(apply ? 'COMMIT' : 'ROLLBACK');
  console.log(JSON.stringify({ target: args?.target ?? 'local', applied: apply, charts }));
} catch {
  await db?.query('ROLLBACK').catch(() => {});
  console.error('Chart synchronization failed; private details suppressed.');
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}
