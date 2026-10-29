import 'server-only';
import { database } from '@/lib/db/server';
import type { ReviewState } from './input';

export type Candidate = {
  source_url?: string;
  store_url?: string;
  current_version?: string;
  release_notes?: string;
  text?: string;
  content_hash?: string;
  truncated?: boolean;
  app_store_id?: string;
  kind?: string;
};
export type ReviewItem = {
  id: string;
  app_id: string | null;
  submission_id: string | null;
  state: ReviewState;
  revision: number;
  reason: string;
  created_at: string;
  name: string | null;
  app_revision: number | null;
  candidate_payload: Candidate;
  before_payload: Candidate | null;
  snapshot: {
    status?: string;
    currentVersion?: string;
    reviewedAt?: string;
    supportVersion?: string;
    investigationReason?: string;
    evidence?: { quote: string; url: string }[];
  } | null;
};
export async function listReviews(
  actor: string,
  state: ReviewState,
  page: number,
  submissions = false,
) {
  return database(actor, async (db) => {
    const rows = (
      await db.query<ReviewItem>(
        `SELECT r.id,r.app_id,r.submission_id,r.state,r.revision,r.reason,r.created_at::text,a.name,r.candidate_payload
      FROM app_private.review_items r LEFT JOIN app_private.apps a ON a.id=r.app_id
      WHERE r.state=$1 AND ($2::boolean=false OR r.submission_id IS NOT NULL)
      ORDER BY r.created_at DESC,r.id LIMIT 31 OFFSET $3`,
        [state, submissions, (page - 1) * 30],
      )
    ).rows;
    return { items: rows.slice(0, 30), hasNext: rows.length > 30 };
  });
}
export async function getReview(actor: string, id: string) {
  return database(
    actor,
    async (db) =>
      (
        await db.query<ReviewItem>(
          `SELECT r.*,r.created_at::text,a.name,a.revision AS app_revision,p.snapshot
    FROM app_private.review_items r LEFT JOIN app_private.apps a ON a.id=r.app_id
    LEFT JOIN public.directory_entries p ON p.app_id=r.app_id AND p.publication='published' WHERE r.id=$1`,
          [id],
        )
      ).rows[0] ?? null,
  );
}
export type Target = {
  id: string;
  app_id: string;
  name: string;
  kind: string;
  url: string;
  enabled: boolean;
  last_success_at: string | null;
  failures: number;
  last_error: string | null;
  next_due_at: string;
  running: boolean;
};
export async function collectionOverview(actor: string) {
  return database(actor, async (db) => ({
    targets: (
      await db.query<Target>(`SELECT t.id,t.app_id,a.name,t.kind,t.url,t.enabled,t.last_success_at::text,t.failures,t.last_error,t.next_due_at::text,
      (t.lease_token IS NOT NULL AND t.lease_expires_at>now()) AS running
      FROM app_private.collection_targets t JOIN app_private.apps a ON a.id=t.app_id ORDER BY t.next_due_at,t.id LIMIT 200`)
    ).rows,
    runs: (
      await db.query<{
        id: string;
        name: string;
        state: string;
        attempts: number;
        error_code: string | null;
        started_at: string;
      }>(`SELECT r.id,a.name,r.state,r.attempts,r.error_code,r.started_at::text FROM app_private.collection_runs r
      JOIN app_private.collection_targets t ON t.id=r.target_id JOIN app_private.apps a ON a.id=t.app_id ORDER BY r.started_at DESC,r.id LIMIT 30`)
    ).rows,
  }));
}
export async function matchingSubmissionApp(actor: string, appStoreId: string) {
  return database(
    actor,
    async (db) =>
      (
        await db.query<{ id: string; name: string }>(
          'SELECT id,name FROM app_private.apps WHERE app_store_id=$1',
          [appStoreId],
        )
      ).rows[0] ?? null,
  );
}
