import type { DatabaseClient } from '../db/types.ts';
import type {
  DirectoryQuery,
  DirectoryResult,
  Locale,
  RealDirectoryApp,
  PublicHistory,
  DirectoryStats,
} from '../directory/types.ts';
import { assertDirectoryStats } from '../directory/stats.ts';
const PAGE_SIZE = 24;

// Call only inside an anonymous-role transaction. All query input is bound data;
// ORDER BY fragments below are a closed allow-list, never interpolated user SQL.
export async function queryDirectory(
  db: DatabaseClient,
  query: DirectoryQuery,
  locale: Locale,
): Promise<DirectoryResult> {
  const where = `($2='all' OR snapshot->>'category'=$2)
    AND ($3='all' OR snapshot->>'status'=$3)
    AND strpos(lower(normalize(concat_ws(' ', snapshot->'names'->>'ko', snapshot->'names'->>'en',
      (SELECT string_agg(value,' ') FROM jsonb_array_elements_text(snapshot->'aliases'))),NFC)),lower(normalize($1,NFC)))>0`;
  const language = locale === 'ko' ? 'ko' : 'en';
  const nameOrder = `snapshot->'names'->>'${language}',slug`;
  const sort =
    query.sort === 'updated'
      ? `support_changed_at DESC,${nameOrder}`
      : query.sort === 'name'
        ? nameOrder
        : `array_position(ARRAY['supported','planned','unknown','unsupported'],snapshot->>'status'),reviewed_at DESC,${nameOrder}`;
  // Counts, filtering, page clamping and rows share one PostgreSQL statement snapshot.
  // Separate SELECTs under READ COMMITTED can otherwise disagree during publication.
  const result = await db.query<{
    apps: RealDirectoryApp[];
    total: number;
    page: number;
    pages: number;
    stats: DirectoryStats;
  }>(
    `WITH published AS MATERIALIZED (
      SELECT * FROM public.directory_entries WHERE publication='published' AND country='KR'
    ), scoped AS MATERIALIZED (
      SELECT * FROM published WHERE ${where}
    ), pagination AS (
      SELECT count(*)::int AS total,greatest(1,(count(*)+${PAGE_SIZE - 1})/${PAGE_SIZE})::int AS pages FROM scoped
    ), bounds AS (
      SELECT *,least(greatest(1,$4::int),pages) AS page FROM pagination
    ), ordered AS (
      SELECT app_id,snapshot,row_number() OVER(ORDER BY ${sort}) AS position FROM scoped
      ORDER BY ${sort} LIMIT ${PAGE_SIZE} OFFSET (SELECT (page-1)*${PAGE_SIZE} FROM bounds)
    ), overview AS (
      SELECT jsonb_build_object('total',count(*)::int,
        'supported',count(*) FILTER(WHERE snapshot->>'status'='supported')::int,
        'planned',count(*) FILTER(WHERE snapshot->>'status'='planned')::int,
        'unknown',count(*) FILTER(WHERE snapshot->>'status'='unknown')::int,
        'unsupported',count(*) FILTER(WHERE snapshot->>'status'='unsupported')::int) AS stats
      FROM published
    )
    SELECT bounds.*,overview.stats,
      coalesce((SELECT jsonb_agg(snapshot || jsonb_build_object('iconUrl',
        CASE WHEN EXISTS(SELECT 1 FROM public.app_icon_assets i WHERE i.app_id=ordered.app_id)
        THEN '/api/app-icons/' || app_id::text ELSE NULL END) ORDER BY position) FROM ordered),'[]'::jsonb) AS apps
    FROM bounds CROSS JOIN overview`,
    [query.q, query.category, query.status, query.page],
  );
  const row = result.rows[0];
  return { ...row, stats: assertDirectoryStats(row.stats) };
}

export async function queryApp(
  db: DatabaseClient,
  slug: string,
): Promise<{ id: string; app: RealDirectoryApp } | { redirect: string } | null> {
  const { rows } = await db.query<{ app_id: string; slug: string; snapshot: RealDirectoryApp }>(
    `SELECT app_id,slug,snapshot || jsonb_build_object('iconUrl',
      CASE WHEN EXISTS(SELECT 1 FROM public.app_icon_assets i WHERE i.app_id=directory_entries.app_id)
      THEN '/api/app-icons/' || app_id::text ELSE NULL END) AS snapshot FROM public.directory_entries
    WHERE publication='published' AND (slug=$1 OR snapshot->'previousSlugs' ? $1)
    ORDER BY (slug=$1) DESC LIMIT 1`,
    [slug],
  );
  if (!rows.length) return null;
  const row = rows[0];
  return row.slug === slug ? { id: row.app_id, app: row.snapshot } : { redirect: row.slug };
}

export async function queryHistory(
  db: DatabaseClient,
  requestedPage = 1,
  appId: string | null = null,
): Promise<{ items: PublicHistory[]; total: number; page: number; pages: number }> {
  const where = "e.publication='published' AND ($1::uuid IS NULL OR h.app_id=$1::uuid)";
  const total = (
    await db.query<{ total: number }>(
      `SELECT count(*)::integer AS total FROM public.support_history h
    JOIN public.directory_entries e ON e.app_id=h.app_id WHERE ${where}`,
      [appId],
    )
  ).rows[0].total;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), pages);
  const { rows } = await db.query<{ entry: PublicHistory }>(
    `SELECT jsonb_build_object('id',h.id,'slug',e.slug,'names',e.snapshot->'names',
    'beforeStatus',h.before_snapshot->>'status','afterStatus',h.after_snapshot->>'status',
    'reason',h.change_reason,'changedAt',h.changed_at) AS entry
    FROM public.support_history h JOIN public.directory_entries e ON e.app_id=h.app_id
    WHERE ${where} ORDER BY h.changed_at DESC,h.id LIMIT $2 OFFSET $3`,
    [appId, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  return { items: rows.map((row) => row.entry), total, page, pages };
}
