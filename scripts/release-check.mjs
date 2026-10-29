import { localDatabaseUrl, databaseClient } from './lib/database.mjs';
import { hostedArguments, loadHosted } from './lib/hosted.mjs';
import { iconStorage } from '../src/lib/icons/storage.mjs';
let db;
try {
  const hosted = process.argv.slice(2).length > 0;
  const args = hosted ? hostedArguments() : null;
  if (args?.apply) throw new Error('Read-only report.');
  const env = hosted ? loadHosted(args) : process.env;
  db = databaseClient(hosted ? env.DATABASE_URL : localDatabaseUrl());
  await db.connect();
  const {
    rows: [counts],
  } = await db.query(`SELECT
    count(*)::int AS apps,
    count(*) FILTER (WHERE publication='draft')::int AS drafts,
    count(*) FILTER (WHERE publication='published')::int AS published,
    count(*) FILTER (WHERE category IS NULL)::int AS missing_category,
    count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM app_private.app_support s WHERE s.app_id=a.id AND s.reviewed_at IS NOT NULL))::int AS missing_human_review,
    count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM app_private.app_evidence e WHERE e.app_id=a.id))::int AS missing_evidence,
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM unnest(ARRAY['ko','en']) AS required(locale) WHERE NOT EXISTS (SELECT 1 FROM app_private.app_translations t WHERE t.app_id=a.id AND t.locale=required.locale AND t.state='current' AND length(btrim(t.summary))>0)))::int AS missing_current_translation,
    count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.app_icon_assets i WHERE i.app_id=a.id))::int AS missing_icon_metadata
    FROM app_private.apps a`);
  const assets = (await db.query('SELECT storage_path,byte_size FROM public.app_icon_assets')).rows;
  let invalidFiles = 0;
  const storage = iconStorage(env);
  for (const asset of assets) {
    try {
      if ((await storage.read(asset.storage_path)).length !== asset.byte_size) invalidFiles++;
    } catch {
      invalidFiles++;
    }
  }
  const blockers = [];
  if (!counts.published) blockers.push('No reviewed apps are published.');
  for (const [name, count] of Object.entries(counts))
    if (name.startsWith('missing_') && count) blockers.push(`${name}: ${count}`);
  if (invalidFiles) blockers.push(`Missing/corrupt icon files: ${invalidFiles}`);
  console.log(
    JSON.stringify(
      {
        target: args?.target ?? 'local',
        counts,
        iconFiles: assets.length,
        invalidFiles,
        blockers,
        ready: blockers.length === 0,
      },
      null,
      2,
    ),
  );
  if (blockers.length) process.exitCode = 1;
} catch {
  console.error('Release inspection failed; private details suppressed.');
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}
