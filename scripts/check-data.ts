import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { localDatabaseUrl, databaseClient } from './lib/database.ts';
import { hostedArguments, loadHosted } from './lib/hosted.ts';
import { auditContentQuality } from './lib/content-quality.ts';
let db;
try {
  const args = process.argv.length > 2 ? hostedArguments() : null;
  if (args?.apply || args?.source) throw new Error('This command only audits data.');
  db = databaseClient(args ? loadHosted(args).DATABASE_URL : localDatabaseUrl());
  await db.connect();
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const audit = await auditContentQuality(db);
  await db.query('ROLLBACK');
  const codeHash = createHash('sha256')
    .update(await readFile(new URL('./lib/content-quality.ts', import.meta.url)))
    .digest('hex');
  const report = {
    target: args?.target ?? 'local',
    grain: 'One app per App Store ID, KR storefront; published metrics exclude drafts/archives.',
    ...audit,
    checksSource: 'scripts/lib/content-quality.ts',
    codeHash,
    physicalIconBytesChecked: false,
    supportClaimsIndependentlyReverified: false,
  };
  await mkdir('.data/quality', { recursive: true, mode: 0o700 });
  const path = `.data/quality/audit-${Date.now()}.json`;
  await writeFile(path, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ ...report, reportPath: path }, null, 2));
  if (audit.errors.length) process.exitCode = 1;
} catch {
  await db?.query('ROLLBACK').catch(() => {});
  console.error('Data audit failed; private details suppressed.');
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}
