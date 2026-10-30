import type { DatabaseClient } from '../../src/lib/db/types.ts';
import { categories } from '../../src/lib/directory/types.ts';

// Static, versioned checks. Pending draft edits and historical evidence are warnings,
// never instructions to overwrite a reviewed public snapshot.
export const qualityRules = [
  [
    'duplicate_store_ids',
    'error',
    `SELECT count(*)::int AS count FROM (SELECT app_store_id FROM app_private.apps GROUP BY 1 HAVING count(*)>1) x`,
  ],
  [
    'duplicate_slugs',
    'error',
    `SELECT count(*)::int AS count FROM (SELECT slug FROM app_private.apps GROUP BY 1 HAVING count(*)>1) x`,
  ],
  [
    'published_missing_snapshot',
    'error',
    `SELECT count(*)::int AS count FROM app_private.apps a LEFT JOIN public.directory_entries d ON d.app_id=a.id WHERE a.publication='published' AND (d.app_id IS NULL OR d.publication<>'published')`,
  ],
  [
    'hidden_apps_public',
    'error',
    `SELECT count(*)::int AS count FROM public.directory_entries d JOIN app_private.apps a ON a.id=d.app_id WHERE d.publication='published' AND a.publication<>'published'`,
  ],
  [
    'published_missing_kr_records',
    'error',
    `SELECT count(*)::int AS count FROM app_private.apps a LEFT JOIN app_private.app_store_listings l ON l.app_id=a.id AND l.country='KR' LEFT JOIN app_private.app_support s ON s.app_id=a.id AND s.country='KR' WHERE a.publication='published' AND (l.app_id IS NULL OR s.app_id IS NULL)`,
  ],
  [
    'listing_wrong_identity',
    'error',
    `SELECT count(*)::int AS count FROM app_private.apps a JOIN app_private.app_store_listings l ON l.app_id=a.id WHERE l.store_url<>'https://apps.apple.com/kr/app/id'||a.app_store_id`,
  ],
  [
    'decided_support_without_evidence',
    'error',
    `SELECT count(*)::int AS count FROM public.directory_entries d WHERE d.publication='published' AND d.snapshot->>'status' IN('supported','planned','unsupported') AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(d.snapshot->'evidence')='array' THEN d.snapshot->'evidence' ELSE '[]'::jsonb END) item JOIN app_private.evidence e ON e.id::text=item->>'id' JOIN app_private.sources s ON s.id=e.source_id WHERE s.official_confirmed AND e.country='KR' AND e.quote=item->>'quote' AND s.url=item->>'url' AND (s.kind<>'app_store' OR s.url=d.snapshot->>'storeUrl') AND (d.snapshot->>'supportVersion' IS NULL OR e.support_version IS NULL OR d.snapshot->>'supportVersion'=e.support_version))`,
  ],
  [
    'evidence_app_url_mismatch',
    'error',
    `SELECT count(*)::int AS count FROM app_private.app_evidence ae JOIN app_private.apps a ON a.id=ae.app_id JOIN app_private.evidence e ON e.id=ae.evidence_id JOIN app_private.sources s ON s.id=e.source_id WHERE s.kind='app_store' AND s.url<>'https://apps.apple.com/kr/app/id'||a.app_store_id`,
  ],
  [
    'unknown_without_reason',
    'error',
    `SELECT count(*)::int AS count FROM public.directory_entries WHERE publication='published' AND snapshot->>'status'='unknown' AND btrim(coalesce(snapshot->>'investigationReason',''))=''`,
  ],
  [
    'published_missing_icon',
    'error',
    `SELECT count(*)::int AS count FROM app_private.apps a LEFT JOIN public.app_icon_assets i ON i.app_id=a.id WHERE a.publication='published' AND i.app_id IS NULL`,
  ],
  [
    'published_missing_original_translation',
    'error',
    `SELECT count(*)::int AS count FROM public.directory_entries d WHERE d.publication='published' AND (coalesce(d.snapshot->>'originalLocale','') NOT IN('ko','en') OR d.snapshot->'translations'->(d.snapshot->>'originalLocale')->>'state' IS DISTINCT FROM 'current' OR btrim(coalesce(d.snapshot->'translations'->(d.snapshot->>'originalLocale')->>'summary',''))='')`,
  ],
  [
    'draft_decision_missing_evidence',
    'warning',
    `SELECT count(*)::int AS count FROM app_private.app_support p WHERE p.status<>'unknown' AND NOT EXISTS(SELECT 1 FROM app_private.app_evidence ae JOIN app_private.evidence e ON e.id=ae.evidence_id JOIN app_private.sources s ON s.id=e.source_id WHERE ae.app_id=p.app_id AND e.country='KR' AND s.official_confirmed AND (p.support_version IS NULL OR e.support_version IS NULL OR p.support_version=e.support_version))`,
  ],
  [
    'published_invalid_category',
    'error',
    `SELECT count(*)::int AS count FROM public.directory_entries WHERE publication='published' AND (snapshot->>'category' IS NULL OR NOT(snapshot->>'category'=ANY($1::text[])))`,
  ],
  [
    'invalid_public_snapshot',
    'error',
    `SELECT count(*)::int AS count FROM public.directory_entries d JOIN app_private.apps a ON a.id=d.app_id WHERE d.publication='published' AND (d.snapshot->>'slug' IS DISTINCT FROM d.slug OR d.snapshot->>'publication' IS DISTINCT FROM 'published' OR d.snapshot->>'country' IS DISTINCT FROM 'KR' OR d.snapshot->'fictional' IS DISTINCT FROM 'false'::jsonb OR d.snapshot->>'storeUrl' IS DISTINCT FROM 'https://apps.apple.com/kr/app/id'||a.app_store_id OR coalesce(d.snapshot->>'status','') NOT IN('supported','planned','unknown','unsupported') OR jsonb_typeof(d.snapshot->'names'->'ko') IS DISTINCT FROM 'string' OR jsonb_typeof(d.snapshot->'names'->'en') IS DISTINCT FROM 'string' OR btrim(coalesce(d.snapshot->'names'->>'ko',''))='' OR btrim(coalesce(d.snapshot->'names'->>'en',''))='')`,
  ],
  [
    'public_decision_missing_evidence',
    'error',
    `SELECT count(*)::int AS count FROM public.directory_entries WHERE publication='published' AND snapshot->>'status' IN('supported','planned','unsupported') AND CASE WHEN jsonb_typeof(snapshot->'evidence')='array' THEN jsonb_array_length(snapshot->'evidence') ELSE 0 END=0`,
  ],
  [
    'published_missing_history',
    'error',
    `SELECT count(*)::int AS count FROM public.directory_entries d WHERE d.publication='published' AND NOT EXISTS(SELECT 1 FROM public.support_history h WHERE h.app_id=d.app_id)`,
  ],
  [
    'future_timestamps',
    'error',
    `SELECT count(*)::int AS count FROM app_private.apps a LEFT JOIN app_private.app_store_listings l ON l.app_id=a.id AND l.country='KR' LEFT JOIN app_private.app_support s ON s.app_id=a.id AND s.country='KR' WHERE a.created_at>now()+interval '5 minutes' OR a.updated_at>now()+interval '5 minutes' OR l.last_fetch_success_at>now()+interval '5 minutes' OR s.reviewed_at>now()+interval '5 minutes'`,
  ],
  [
    'rls_disabled',
    'error',
    `SELECT count(*)::int AS count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND (n.nspname='app_private' OR (n.nspname='public' AND c.relname IN('directory_entries','support_history','app_icon_assets'))) AND NOT c.relrowsecurity`,
  ],
  [
    'unvalidated_constraints',
    'error',
    `SELECT count(*)::int AS count FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname IN('app_private','public') AND NOT c.convalidated`,
  ],
  [
    'draft_unmapped_category',
    'warning',
    `SELECT count(*)::int AS count FROM app_private.apps WHERE publication='draft' AND category IS NULL`,
  ],
  [
    'draft_without_support',
    'warning',
    `SELECT count(*)::int AS count FROM app_private.apps a WHERE a.publication='draft' AND NOT EXISTS(SELECT 1 FROM app_private.app_support s WHERE s.app_id=a.id AND s.country='KR')`,
  ],
  [
    'translation_fallback_needed',
    'warning',
    `SELECT count(*)::int AS count FROM public.directory_entries d WHERE d.publication='published' AND EXISTS(SELECT 1 FROM unnest(ARRAY['ko','en']) locale WHERE d.snapshot->'translations'->locale->>'state' IS DISTINCT FROM 'current' OR btrim(coalesce(d.snapshot->'translations'->locale->>'summary',''))='')`,
  ],
  [
    'pending_public_draft_difference',
    'warning',
    `SELECT count(*)::int AS count FROM public.directory_entries d JOIN app_private.apps a ON a.id=d.app_id JOIN app_private.app_support s ON s.app_id=a.id AND s.country='KR' JOIN app_private.app_store_listings l ON l.app_id=a.id AND l.country='KR' WHERE d.publication='published' AND (d.snapshot->>'status' IS DISTINCT FROM s.status OR d.slug IS DISTINCT FROM a.slug OR d.snapshot->>'currentVersion' IS DISTINCT FROM l.current_version OR d.snapshot->>'supportVersion' IS DISTINCT FROM s.support_version OR d.snapshot->>'originalLocale' IS DISTINCT FROM a.original_locale OR d.snapshot->'translations' IS DISTINCT FROM (SELECT jsonb_object_agg(locale,jsonb_build_object('summary',summary,'state',state)) FROM app_private.app_translations t WHERE t.app_id=a.id))`,
  ],
  [
    'icon_source_changed',
    'warning',
    `SELECT count(*)::int AS count FROM public.app_icon_assets i JOIN app_private.app_store_listings l ON l.app_id=i.app_id AND l.country='KR' WHERE i.source_url IS DISTINCT FROM l.icon_url`,
  ],
  [
    'historical_quote_not_in_latest_notes',
    'warning',
    `SELECT count(*)::int AS count FROM app_private.app_evidence ae JOIN app_private.evidence e ON e.id=ae.evidence_id JOIN app_private.sources s ON s.id=e.source_id JOIN app_private.app_store_listings l ON l.app_id=ae.app_id AND l.country='KR' WHERE s.kind='app_store' AND strpos(coalesce(l.observed_metadata->>'release_notes',''),e.quote)=0`,
  ],
] as const;

export async function auditContentQuality(db: DatabaseClient) {
  const profile = (
    await db.query(`SELECT now() AS audited_at,
    (SELECT count(*)::int FROM app_private.apps) AS registered,
    (SELECT count(*)::int FROM app_private.apps WHERE publication='draft') AS drafts,
    (SELECT count(*)::int FROM app_private.apps WHERE publication='archived') AS archived,
    (SELECT count(*)::int FROM public.directory_entries WHERE publication='published') AS published,
    (SELECT count(*)::int FROM app_private.app_support WHERE status='supported') AS supported,
    (SELECT count(*)::int FROM app_private.app_support WHERE status='unknown') AS unverified,
    (SELECT min(last_fetch_success_at) FROM app_private.app_store_listings) AS oldest_fetch,
    (SELECT max(last_fetch_success_at) FROM app_private.app_store_listings) AS newest_fetch`)
  ).rows[0];
  const checks = (
    await db.query<{ key: string; count: number }>(
      qualityRules
        .map(([key, , sql]) => `SELECT '${key}' AS key,count FROM (${sql}) rule`)
        .join('\nUNION ALL\n'),
      [[...categories]],
    )
  ).rows.map((row) => ({ ...row, severity: qualityRules.find(([key]) => key === row.key)![1] }));
  return {
    profile,
    checks,
    errors: checks.filter((check) => check.severity === 'error' && check.count > 0),
    warnings: checks.filter((check) => check.severity === 'warning' && check.count > 0),
  };
}
