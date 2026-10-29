const PAGE_SIZE = 24;

// Call only inside an anonymous-role transaction. All query input is bound data;
// ORDER BY fragments below are a closed allow-list, never interpolated user SQL.
export async function queryDirectory(db, query, locale) {
  const where = `publication='published'
    AND ($2='all' OR snapshot->>'category'=$2)
    AND ($3='all' OR snapshot->>'status'=$3)
    AND strpos(lower(normalize(concat_ws(' ', snapshot->'names'->>'ko', snapshot->'names'->>'en',
      (SELECT string_agg(value,' ') FROM jsonb_array_elements_text(snapshot->'aliases'))),NFC)),lower(normalize($1,NFC)))>0`;
  const values = [query.q, query.category, query.status];
  const total = (
    await db.query(
      `SELECT count(*)::integer AS total FROM public.directory_entries WHERE ${where}`,
      values,
    )
  ).rows[0].total;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), pages);
  const language = locale === 'ko' ? 'ko' : 'en';
  const nameOrder = `snapshot->'names'->>'${language}',slug`;
  const sort =
    query.sort === 'updated'
      ? `support_changed_at DESC,${nameOrder}`
      : query.sort === 'name'
        ? nameOrder
        : `array_position(ARRAY['supported','planned','unknown','unsupported'],snapshot->>'status'),reviewed_at DESC,${nameOrder}`;
  const result = await db.query(
    `SELECT snapshot || jsonb_build_object('iconUrl',
      CASE WHEN EXISTS(SELECT 1 FROM public.app_icon_assets i WHERE i.app_id=directory_entries.app_id)
      THEN '/api/app-icons/' || app_id::text ELSE NULL END) AS snapshot
    FROM public.directory_entries WHERE ${where}
    ORDER BY ${sort} LIMIT $4 OFFSET $5`,
    [...values, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  return { apps: result.rows.map((row) => row.snapshot), total, page, pages };
}

export async function queryApp(db, slug) {
  const { rows } = await db.query(
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

/** @param {import('pg').PoolClient | import('pg').Client} db
 * @param {number} requestedPage
 * @param {string | null} appId */
export async function queryHistory(db, requestedPage = 1, appId = null) {
  const where = "e.publication='published' AND ($1::uuid IS NULL OR h.app_id=$1::uuid)";
  const total = (
    await db.query(
      `SELECT count(*)::integer AS total FROM public.support_history h
    JOIN public.directory_entries e ON e.app_id=h.app_id WHERE ${where}`,
      [appId],
    )
  ).rows[0].total;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), pages);
  const { rows } = await db.query(
    `SELECT jsonb_build_object('id',h.id,'slug',e.slug,'names',e.snapshot->'names',
    'beforeStatus',h.before_snapshot->>'status','afterStatus',h.after_snapshot->>'status',
    'reason',h.change_reason,'changedAt',h.changed_at) AS entry
    FROM public.support_history h JOIN public.directory_entries e ON e.app_id=h.app_id
    WHERE ${where} ORDER BY h.changed_at DESC,h.id LIMIT $2 OFFSET $3`,
    [appId, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );
  return { items: rows.map((row) => row.entry), total, page, pages };
}
