// Explicit owner-requested content batch, never called by automatic collectors or HTTP routes.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { hostedArguments, loadHosted } from './lib/hosted.ts';
import { databaseClient } from './lib/database.ts';
import { contentSnapshot, rowsHash } from './lib/content-transfer.ts';
import {
  assertExpansionBudget,
  chartKinds,
  chartUrl,
  type ChartSnapshot,
} from './lib/apple-charts.ts';
import { appleId, categoryIds, type lookupApple } from '../src/lib/import/apple.ts';
import { collectIcon } from '../src/lib/icons/storage.ts';
import { supabaseIconStorage } from '../src/lib/icons/hosted.ts';

type Metadata = Awaited<ReturnType<typeof lookupApple>>;
type Review = { appStoreId: string; quote: string; ko: string; en: string };
let db;
try {
  const args = hostedArguments();
  if (!args.source) throw new Error('A completed official chart manifest is required.');
  const manifest = JSON.parse(await readFile(args.source, 'utf8')) as {
    version: number;
    completedAt?: string;
    charts: ChartSnapshot[];
    targetTotal?: number;
    baselineAppStoreIds?: string[];
    selectedAppStoreIds?: string[];
    observations: { appStoreId: string; metadata?: Metadata; error?: string }[];
  };
  if (manifest.version !== 1 || !manifest.completedAt || !Array.isArray(manifest.charts))
    throw new Error('Incomplete chart manifest.');
  const expanded = manifest.targetTotal !== undefined;
  const expectedCharts = expanded ? Object.keys(categoryIds).length * 2 : 2;
  if (
    manifest.charts.length !== expectedCharts ||
    new Set(manifest.charts.map((c) => `${c.kind}:${c.genreId ?? 'all'}`)).size !== expectedCharts
  )
    throw new Error('Incomplete chart scopes.');
  for (const chart of manifest.charts) {
    if (
      !chartKinds.includes(chart.kind) ||
      (expanded ? !chart.genreId || !categoryIds[chart.genreId] : !!chart.genreId) ||
      chart.country !== 'KR' ||
      chart.sourceUrl !== chartUrl(chart.kind, chart.genreId) ||
      !Number.isFinite(Date.parse(chart.observedAt)) ||
      !Number.isFinite(Date.parse(chart.updatedAt)) ||
      (expanded ? chart.entries.length > 100 : chart.entries.length !== 100) ||
      chart.entries.some((e, i) => e.rank !== i + 1 || appleId(e.storeUrl) !== e.appStoreId) ||
      new Set(chart.entries.map((e) => e.appStoreId)).size !== chart.entries.length
    )
      throw new Error('Expected complete, unmixed KR chart scopes.');
  }
  const candidates = new Set(manifest.charts.flatMap((c) => c.entries.map((e) => e.appStoreId)));
  const ids = manifest.selectedAppStoreIds ?? [...candidates];
  if (new Set(ids).size !== ids.length || ids.some((id) => !candidates.has(id)))
    throw new Error('Invalid chart selection.');
  if (
    expanded &&
    (manifest.targetTotal !== 1000 ||
      !manifest.baselineAppStoreIds ||
      !manifest.selectedAppStoreIds ||
      new Set(manifest.baselineAppStoreIds).size !== manifest.baselineAppStoreIds.length ||
      ids.length !== 1000 - manifest.baselineAppStoreIds.length ||
      ids.some((id) => manifest.baselineAppStoreIds!.includes(id)))
  )
    throw new Error('Expansion must select only the apps needed to reach 1,000.');
  if (!expanded && manifest.selectedAppStoreIds) throw new Error('Unexpected selection.');
  if (
    manifest.observations.length !== ids.length ||
    new Set(manifest.observations.map((o) => o.appStoreId)).size !== ids.length
  )
    throw new Error('Each chart app needs exactly one observation.');
  for (const id of ids) {
    const row = manifest.observations.find((o) => o.appStoreId === id);
    if (
      !row?.metadata ||
      row.error ||
      row.metadata.app_store_id !== id ||
      appleId(row.metadata.store_url) !== id ||
      !Number.isFinite(Date.parse(row.metadata.fetched_at))
    )
      throw new Error('Resolve failed KR lookups before applying this batch.');
  }
  const reviews = JSON.parse(
    await readFile(args.source.replace(/\.json$/, '.reviews.json'), 'utf8'),
  ) as Review[];
  if (!Array.isArray(reviews) || new Set(reviews.map((r) => r.appStoreId)).size !== reviews.length)
    throw new Error('Invalid reviewed evidence.');
  for (const review of reviews) {
    const metadata = manifest.observations.find(
      (o) => o.appStoreId === review.appStoreId,
    )?.metadata;
    if (
      !metadata ||
      !review.quote.trim() ||
      !metadata.release_notes?.includes(review.quote) ||
      !review.ko.trim() ||
      !review.en.trim()
    )
      throw new Error('Reviewed quotes must occur in the captured official release notes.');
  }
  const ko = JSON.parse(await readFile('src/messages/ko.json', 'utf8')).PopularImport;
  const en = JSON.parse(await readFile('src/messages/en.json', 'utf8')).PopularImport;
  const env = loadHosted(args);
  db = databaseClient(env.DATABASE_URL);
  await db.connect();
  await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
  await db.query("SELECT pg_advisory_xact_lock(hashtext('duo-ready-popular-import'))");
  const before = await contentSnapshot(db);
  if (expanded) {
    assertExpansionBudget(
      before.tables['app_private.apps'].map((app) => String(app.app_store_id)),
      ids,
      manifest.targetTotal!,
    );
  }
  const previousPublic = before.tables['public.directory_entries'];
  const previousIds = before.tables['app_private.apps'].map((row) => row.id);
  if (args.apply) {
    await mkdir('.data/release', { recursive: true, mode: 0o700 });
    await writeFile(
      `.data/release/before-popular-import-${Date.now()}.json`,
      JSON.stringify(before),
      { flag: 'wx', mode: 0o600 },
    );
  }
  const actor = randomUUID();
  await db.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
  await db.query('SET LOCAL ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claims',$1,true)", [
    JSON.stringify({ sub: actor, role: 'authenticated' }),
  ]);
  const storage = supabaseIconStorage(env);
  const counts = { existing: 0, created: 0, supported: 0, unknown: 0, heldForCategory: 0 };
  let expectedPublicCoverage = 0;
  for (const id of ids) {
    const metadata = manifest.observations.find((o) => o.appStoreId === id)!.metadata!;
    const discovery = {
      kind: 'chart_discovery',
      charts: manifest.charts.flatMap((chart) =>
        chart.entries
          .filter((e) => e.appStoreId === id)
          .map((e) => ({
            country: 'KR',
            kind: chart.kind,
            ...(chart.genreId ? { genreId: chart.genreId } : {}),
            rank: e.rank,
            sourceUrl: chart.sourceUrl,
            updatedAt: chart.updatedAt,
            observedAt: chart.observedAt,
          })),
      ),
    };
    const existing = (
      await db.query<{ id: string; publication: string }>(
        'SELECT id,publication FROM app_private.apps WHERE app_store_id=$1 FOR UPDATE',
        [id],
      )
    ).rows[0];
    if (existing) {
      // Add discovery provenance only; never refresh or republish a previously curated app.
      await db.query(
        `INSERT INTO app_private.import_proposals(app_id,fingerprint,proposal)
        VALUES($1,encode(sha256(convert_to($2::jsonb::text,'UTF8')),'hex'),$2)
        ON CONFLICT(app_id,fingerprint) DO NOTHING`,
        [existing.id, discovery],
      );
      counts.existing++;
      if (existing.publication === 'published') expectedPublicCoverage++;
      continue;
    }
    const imported = (
      await db.query('SELECT app_private.import_app($1,$2) AS app', [metadata, discovery])
    ).rows[0].app as { id: string; state: string };
    if (imported.state !== 'created') throw new Error('Concurrent app import; retry the batch.');
    const review = reviews.find((r) => r.appStoreId === id);
    const app = (await db.query('SELECT * FROM app_private.apps WHERE id=$1', [imported.id]))
      .rows[0];
    const summaryKo = review?.ko ?? ko.summary;
    const saved = (
      await db.query('SELECT app_private.save_app($1,$2) AS app', [
        {
          id: app.id,
          app_store_id: id,
          slug: app.slug,
          name: metadata.name,
          developer: metadata.developer,
          category: metadata.category,
          original_locale: 'ko',
          aliases: [],
          current_version: metadata.current_version,
          release_notes: metadata.release_notes,
          status: review ? 'supported' : 'unknown',
          support_version: review ? metadata.current_version : null,
          investigation_reason: review ? '' : ko.investigation,
          translations: {
            ko: { name: metadata.name, summary: summaryKo, state: 'current' },
            en: { name: metadata.name, summary: review?.en ?? en.summary, state: 'current' },
          },
          evidence: review
            ? [
                {
                  url: metadata.store_url,
                  title: metadata.name,
                  kind: 'app_store',
                  official_confirmed: true,
                  quote: review.quote,
                  support_version: metadata.current_version,
                },
              ]
            : [],
        },
        app.revision,
      ])
    ).rows[0].app as { id: string; revision: number };
    if (args.apply) {
      let stored = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        if ((await collectIcon(db, app.id, metadata.icon_url, { storage })) === 'stored') {
          stored = true;
          break;
        }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
      }
      if (!stored) throw new Error('Icon storage failed; no content will be committed.');
    }
    if (metadata.category)
      await db.query('SELECT app_private.publish_app($1,$2,$3,$4)', [
        saved.id,
        saved.revision,
        `${ko.reason} / ${en.reason}`,
        `Owner requested chart-priority database coverage in Codex on 2026-10-30. Official KR release notes observed ${metadata.fetched_at}; no device test or badge observation. CLI actor identifies this transaction, not a human reviewer. Unknown means no confirmed support evidence, not official non-support. Charts are discovery only.`,
      ]);
    else counts.heldForCategory++;
    if (metadata.category) expectedPublicCoverage++;
    counts.created++;
    counts[review ? 'supported' : 'unknown']++;
    if (counts.created % 10 === 0) console.log(`${counts.created} new apps prepared.`);
  }
  await db.query('RESET ROLE');
  await db.query('DELETE FROM app_private.admin_users WHERE user_id=$1', [actor]);
  const afterPublic = (
    await db.query(
      'SELECT to_jsonb(d) AS row FROM public.directory_entries d WHERE app_id=ANY($1::uuid[])',
      [previousIds],
    )
  ).rows.map((r) => r.row);
  if (rowsHash(previousPublic) !== rowsHash(afterPublic))
    throw new Error('Existing public content changed.');
  await db.query('SET LOCAL ROLE anon');
  const coverage = (
    await db.query(
      `SELECT count(*)::int AS count FROM public.directory_entries WHERE publication='published' AND snapshot->>'storeUrl'=ANY($1)`,
      [ids.map((id) => `https://apps.apple.com/kr/app/id${id}`)],
    )
  ).rows[0].count;
  if (coverage !== expectedPublicCoverage)
    throw new Error('Anonymous chart coverage verification failed.');
  await db.query('RESET ROLE');
  const databaseCoverage = (
    await db.query(
      "SELECT count(*)::int AS count FROM app_private.apps a JOIN app_private.app_support s ON s.app_id=a.id AND s.country='KR' WHERE a.app_store_id=ANY($1)",
      [ids],
    )
  ).rows[0].count;
  if (databaseCoverage !== ids.length) throw new Error('Chart apps or support states are missing.');
  const totalApps = (await db.query('SELECT count(*)::int AS count FROM app_private.apps')).rows[0]
    .count;
  if (expanded && totalApps !== manifest.targetTotal)
    throw new Error('Database total verification failed.');
  await db.query(args.apply ? 'COMMIT' : 'ROLLBACK');
  console.log(
    JSON.stringify({
      target: args.target,
      applied: !!args.apply,
      chartApps: ids.length,
      coverage,
      databaseCoverage,
      totalApps,
      ...counts,
      existingPublicUnchanged: true,
      persistentAdminCreated: false,
    }),
  );
} catch (error) {
  await db?.query('ROLLBACK').catch(() => {});
  const code = error && typeof error === 'object' && 'code' in error ? error.code : 'preflight';
  console.error('Popular app import failed and rolled back; private details suppressed.', code);
  process.exitCode = 1;
} finally {
  await db?.end().catch(() => {});
}
