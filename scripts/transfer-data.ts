import { readFile, stat } from 'node:fs/promises';
import { hostedArguments, loadHosted } from './lib/hosted.ts';
import { databaseClient } from './lib/database.ts';
import { transferContent } from './lib/content-transfer.ts';
let db;
try {
  const args = hostedArguments();
  const env = loadHosted(args);
  if (!args.source || (await stat(args.source)).size > 16777216)
    throw new Error('Manifest required; maximum16MiB.');
  const snapshot = JSON.parse(await readFile(args.source, 'utf8'));
  db = databaseClient(env.DATABASE_URL);
  await db.connect();
  console.log(JSON.stringify(await transferContent(db, snapshot, args.apply === true), null, 2));
} catch {
  console.error(
    'Content transfer failed. Check manifest, exact target, TLS and empty/identical destination; no private values printed.',
  );
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}
