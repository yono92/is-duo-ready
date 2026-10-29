// One-time, owner-authorized initial release; never called by collection workers or HTTP routes.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { hostedArguments, loadHosted } from './lib/hosted.ts';
import { databaseClient } from './lib/database.ts';
import { contentSnapshot } from './lib/content-transfer.ts';
import { categoryIds } from '../src/lib/import/apple.ts';

let db;
try {
  const args = hostedArguments();
  if (!args.source) throw new Error('The original import manifest is required.');
  const manifest = JSON.parse(await readFile(args.source, 'utf8')) as {
    observations: { id: string; appId?: string }[];
  };
  const reviews = JSON.parse(await readFile('docs/data/initial-app-reviews.json', 'utf8')) as {
    apps: { appStoreId: string; quote: string }[];
  };
  const ids = manifest.observations.filter((row) => row.appId).map((row) => row.id);
  if (ids.length !== 128 || new Set(ids).size !== 128 || reviews.apps.length !== 22)
    throw new Error('Unexpected initial release manifest.');
  const ko = JSON.parse(await readFile('src/messages/ko.json', 'utf8')).InitialPublication;
  const en = JSON.parse(await readFile('src/messages/en.json', 'utf8')).InitialPublication;
  const env = loadHosted(args);
  db = databaseClient(env.DATABASE_URL);
  await db.connect();
  await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
  await db.query("SELECT pg_advisory_xact_lock(hashtext('duo-ready-initial-publication'))");
  const { rows: apps } = await db.query<{
    id: string;
    app_store_id: string;
    name: string;
    category: string | null;
    revision: number;
    publication: string;
    status: string | null;
    genre: string | null;
  }>(
    `SELECT a.*, s.status, l.observed_metadata->>'primary_genre_id' AS genre
    FROM app_private.apps a JOIN app_private.app_store_listings l ON l.app_id=a.id AND l.country='KR'
    LEFT JOIN app_private.app_support s ON s.app_id=a.id AND s.country='KR'
    WHERE a.app_store_id=ANY($1) ORDER BY a.app_store_id FOR UPDATE OF a`,
    [ids],
  );
  if (apps.length !== 128 || apps.some((a) => a.publication !== 'draft'))
    throw new Error('Only the complete, still-draft initial batch can be published.');
  for (const app of apps) {
    const review = reviews.apps.find((r) => r.appStoreId === app.app_store_id);
    if (review) {
      const evidence = await db.query(
        `SELECT 1 FROM app_private.app_evidence ae
        JOIN app_private.evidence e ON e.id=ae.evidence_id
        JOIN app_private.sources s ON s.id=e.source_id
        WHERE ae.app_id=$1 AND s.official_confirmed AND e.country='KR' AND e.quote=$2`,
        [app.id, review.quote],
      );
      if (app.status !== 'supported' || !evidence.rowCount)
        throw new Error('Reviewed support evidence changed; stop for inspection.');
    } else if (app.status !== null) throw new Error('Unreviewed app changed; stop for inspection.');
    if (!app.category && !categoryIds[app.genre ?? '']) throw new Error('Unmapped Apple category.');
  }
  if (args.apply) {
    await mkdir('.data/release', { recursive: true, mode: 0o700 });
    await writeFile(
      `.data/release/before-initial-publication-${Date.now()}.json`,
      JSON.stringify(await contentSnapshot(db)),
      { flag: 'wx', mode: 0o600 },
    );
  }
  // This UUID identifies this CLI operation, not a human or a Supabase Auth account.
  // Its allow-list row exists only inside this transaction and is removed before commit.
  const actor = randomUUID();
  await db.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
  await db.query('SET LOCAL ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claims',$1,true)", [
    JSON.stringify({ sub: actor, role: 'authenticated' }),
  ]);
  const note =
    'Owner authorized initial publication on 2026-10-29 in Codex: publish explicit support wording; list remaining apps as unsupported with an unverified-evidence qualifier. Actor is an ephemeral CLI batch identifier, not a human reviewer. Timestamp records publication review, not device testing. Original evidence observation timestamps remain unchanged.';
  for (const app of apps) {
    if (!app.category)
      await db.query('UPDATE app_private.apps SET category=$2 WHERE id=$1', [
        app.id,
        categoryIds[app.genre!],
      ]);
    if (app.status === null) {
      await db.query(
        `INSERT INTO app_private.app_support(app_id,status,summary,investigation_reason)
        VALUES($1,'unknown',$2,$2)`,
        [app.id, ko.summary],
      );
      for (const [locale, summary] of [
        ['ko', ko.summary],
        ['en', en.summary],
      ]) {
        await db.query(
          `INSERT INTO app_private.app_translations(app_id,locale,name,summary,state)
          VALUES($1,$2,$3,$4,'current') ON CONFLICT(app_id,locale) DO UPDATE
          SET summary=excluded.summary,state='current'`,
          [app.id, locale, app.name, summary],
        );
      }
    }
    await db.query('SELECT app_private.publish_app($1,$2,$3,$4)', [
      app.id,
      app.revision,
      `${ko.reason} / ${en.reason}`,
      note,
    ]);
  }
  await db.query('RESET ROLE');
  await db.query('DELETE FROM app_private.admin_users WHERE user_id=$1', [actor]);
  await db.query('SET LOCAL ROLE anon');
  const counts = (
    await db.query(`SELECT snapshot->>'status' AS status,count(*)::int AS count
    FROM public.directory_entries WHERE publication='published' GROUP BY 1 ORDER BY 1`)
  ).rows;
  if (
    counts.find((r) => r.status === 'supported')?.count !== 22 ||
    counts.find((r) => r.status === 'unknown')?.count !== 106
  )
    throw new Error('Anonymous publication verification failed.');
  await db.query(args.apply ? 'COMMIT' : 'ROLLBACK');
  console.log(
    JSON.stringify({
      target: args.target,
      applied: !!args.apply,
      counts,
      categoriesFilled: apps.filter((a) => !a.category).length,
      persistentAdminCreated: false,
    }),
  );
} catch (error) {
  await db?.query('ROLLBACK').catch(() => {});
  console.error(
    'Initial publication failed and rolled back; private details suppressed.',
    error && typeof error === 'object' && 'code' in error ? error.code : 'preflight',
  );
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}
