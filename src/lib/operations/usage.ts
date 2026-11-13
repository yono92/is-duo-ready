import 'server-only';
import { database } from '@/lib/db/server';
import type { UsageReport } from './usage-types';

export type { UsageDetails, UsageReport } from './usage-types';

export async function getUsageReports(appId: string): Promise<UsageReport[]> {
  return database(
    null,
    async (db) =>
      (
        await db.query<UsageReport>(
          `SELECT r.id,r.app_id AS "appId",r.body,r.evidence_url AS "evidenceUrl",
          r.usage,r.locale,r.published_at::text AS "publishedAt",
          EXISTS(SELECT 1 FROM public.usage_report_images i WHERE i.report_id=r.id) AS "hasScreenshot"
        FROM public.usage_reports r WHERE r.app_id=$1
        ORDER BY r.published_at DESC,r.id LIMIT 20`,
          [appId],
        )
      ).rows,
  );
}

export async function getUsageScreenshot(
  submissionId: string,
  actor?: string,
): Promise<{ bytes: Buffer; contentType: 'image/webp' } | null> {
  return database(actor ?? null, async (db) => {
    const row = (
      await db.query<{ bytes: Buffer }>(
        actor
          ? 'SELECT bytes FROM app_private.submission_screenshots WHERE submission_id=$1'
          : 'SELECT bytes FROM public.usage_report_images WHERE report_id=$1',
        [submissionId],
      )
    ).rows[0];
    return row ? { bytes: row.bytes, contentType: 'image/webp' } : null;
  });
}
