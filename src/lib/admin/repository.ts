import 'server-only';
import { database } from '@/lib/db/server';
import type { AdminDraft } from './input';

export async function listAdminApps(actor: string, search = '') {
  return database(
    actor,
    async (db) =>
      (
        await db.query<{
          id: string;
          name: string;
          slug: string;
          publication: string;
          app_store_id: string;
          revision: number;
          icon_url: string | null;
        }>(
          `SELECT id,name,slug,publication,app_store_id,revision,
    CASE WHEN EXISTS(SELECT 1 FROM public.app_icon_assets i WHERE i.app_id=apps.id)
      THEN '/api/admin/app-icons/' || id::text ELSE NULL END AS icon_url FROM app_private.apps
    WHERE strpos(lower(name || ' ' || app_store_id),lower($1))>0 ORDER BY updated_at DESC,id LIMIT 200`,
          [search.slice(0, 100)],
        )
      ).rows,
  );
}

export async function getAdminApp(actor: string, id: string): Promise<AdminDraft | null> {
  return database(actor, async (db) => {
    const { rows } = await db.query(
      `SELECT a.*,CASE WHEN EXISTS(SELECT 1 FROM public.app_icon_assets i WHERE i.app_id=a.id)
        THEN '/api/admin/app-icons/' || a.id::text ELSE NULL END AS icon_url,
      coalesce(l.current_version,'') AS current_version,
      coalesce(l.release_notes,'') AS release_notes,coalesce(s.status,'unknown') AS status,
      coalesce(s.support_version,'') AS support_version,coalesce(s.investigation_reason,'') AS investigation_reason
      FROM app_private.apps a LEFT JOIN app_private.app_store_listings l ON l.app_id=a.id AND l.country='KR'
      LEFT JOIN app_private.app_support s ON s.app_id=a.id AND s.country='KR' WHERE a.id=$1`,
      [id],
    );
    if (!rows.length) return null;
    const translations = await db.query(
      'SELECT locale,name,summary,state FROM app_private.app_translations WHERE app_id=$1',
      [id],
    );
    const evidence = await db.query(
      `SELECT s.url,s.title,s.kind,s.official_confirmed,e.quote,
      coalesce(to_char(e.announced_at,'YYYY-MM-DD'),'') AS announced_at,coalesce(e.support_version,'') AS support_version,
      coalesce((SELECT jsonb_agg(jsonb_build_object('key',f.feature_key,'description',f.description) ORDER BY f.feature_key)
        FROM app_private.support_features f WHERE f.app_id=ae.app_id AND f.evidence_id=e.id),'[]'::jsonb) AS features
      FROM app_private.app_evidence ae JOIN app_private.evidence e ON e.id=ae.evidence_id
      JOIN app_private.sources s ON s.id=e.source_id WHERE ae.app_id=$1 ORDER BY e.id`,
      [id],
    );
    return {
      ...rows[0],
      category: rows[0].category ?? '',
      translations: Object.fromEntries(
        translations.rows.map(({ locale, ...value }) => [locale, value]),
      ),
      evidence: evidence.rows,
    };
  });
}

export async function saveAdminApp(actor: string, payload: AdminDraft) {
  return database(
    actor,
    async (db) =>
      (
        await db.query<{ app: { id: string; revision: number; slug: string } }>(
          'SELECT app_private.save_app($1::jsonb,$2) AS app',
          [JSON.stringify(payload), payload.revision ?? null],
        )
      ).rows[0].app,
  );
}

export async function reviewAdminApp(
  actor: string,
  id: string,
  revision: number,
  reason: string,
  archive: boolean,
) {
  return database(
    actor,
    async (db) =>
      (
        await db.query<{ app: { id: string; revision: number; slug: string } }>(
          archive
            ? 'SELECT app_private.archive_app($1,$2,$3) AS app'
            : 'SELECT app_private.publish_app($1,$2,$3) AS app',
          [id, revision, reason],
        )
      ).rows[0].app,
  );
}
