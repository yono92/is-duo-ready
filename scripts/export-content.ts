import { mkdir, writeFile } from 'node:fs/promises';
import { localDatabaseUrl, databaseClient } from './lib/database.ts';
import { contentSnapshot, transferSummary } from './lib/content-transfer.ts';
let db;
try {
  db = databaseClient(localDatabaseUrl());
  await db.connect();
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const snapshot = await contentSnapshot(db);
  await db.query('COMMIT');
  await mkdir('.data/release', { recursive: true, mode: 0o700 });
  const file = `.data/release/content-${Date.now()}.json`;
  await writeFile(file, JSON.stringify(snapshot), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ file, tables: transferSummary(snapshot) }, null, 2));
} catch {
  console.error('Content export failed; source unchanged, private details suppressed.');
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}
