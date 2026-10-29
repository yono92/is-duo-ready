import 'server-only';
import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { database } from '@/lib/db/server';
import type { ImportInput, Proposal } from './input';
import { ImportError, lookupApple } from './apple.ts';
import { collectIcon } from '@/lib/icons/storage.ts';

export type ImportRow = {
  number: number;
  url: string;
  state: 'pending' | 'created' | 'updated' | 'duplicate' | 'error';
  appId: string | null;
  error: string | null;
  retryable: boolean;
  missingEvidence: boolean;
};
export type ImportRun = { id: string; rows: ImportRow[] };

async function readRun(db: PoolClient, id: string): Promise<ImportRun> {
  const { rows } = await db.query<ImportRow>(
    `SELECT row_number AS number,input_url AS url,state,app_id AS "appId",error_code AS error,retryable,
    (coalesce(proposal->>'source_url','')='' OR coalesce(proposal->>'evidence_summary','')='') AS "missingEvidence"
    FROM app_private.import_rows WHERE run_id=$1 ORDER BY row_number`,
    [id],
  );
  if (!rows.length) throw new ImportError('runNotFound');
  return { id, rows };
}

export async function createImportRun(actor: string, input: ImportInput[]) {
  return database(actor, async (db) => {
    const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const {
      rows: [run],
    } = await db.query<{ id: string }>(
      'INSERT INTO app_private.import_runs(actor,input_fingerprint) VALUES($1,$2) RETURNING id',
      [actor, fingerprint],
    );
    for (const row of input)
      await db.query(
        `INSERT INTO app_private.import_rows(run_id,row_number,input_url,app_store_id,state,error_code,proposal)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [
          run.id,
          row.number,
          row.url,
          row.appStoreId,
          row.error ? 'error' : 'pending',
          row.error,
          row.proposal,
        ],
      );
    return readRun(db, run.id);
  });
}

export async function listImportRuns(actor: string) {
  return database(
    actor,
    async (db) =>
      (
        await db.query<{
          id: string;
          createdAt: string;
          total: number;
          pending: number;
        }>(`SELECT r.id,to_char(r.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
    count(*)::int AS total,count(*) FILTER(WHERE i.state='pending')::int AS pending
    FROM app_private.import_runs r JOIN app_private.import_rows i ON i.run_id=r.id GROUP BY r.id ORDER BY r.created_at DESC LIMIT 20`)
      ).rows,
  );
}
export async function getImportRun(actor: string, id: string) {
  return database(actor, (db) => readRun(db, id));
}

// One row per action keeps bounded network retries within a request and makes cancellation resumable.
export async function processImportRow(actor: string, id: string) {
  return database(actor, async (db) => {
    const locked = (await db.query('SELECT pg_try_advisory_xact_lock(409,4) AS locked')).rows[0]
      .locked;
    if (!locked) throw new ImportError('busy');
    const row = (
      await db.query<{ number: number; appStoreId: string; proposal: Proposal }>(
        `SELECT row_number AS number,app_store_id AS "appStoreId",proposal
      FROM app_private.import_rows WHERE run_id=$1 AND state='pending' ORDER BY row_number LIMIT 1 FOR UPDATE`,
        [id],
      )
    ).rows[0];
    if (!row) return readRun(db, id);
    let metadata: Awaited<ReturnType<typeof lookupApple>>;
    try {
      metadata = await lookupApple(row.appStoreId, {
        beforeAttempt: async () => {
          const ms = Number(
            (
              await db.query(
                `SELECT greatest(0,3000-extract(epoch FROM (clock_timestamp()-last_attempt_at))*1000) AS ms FROM app_private.import_clock WHERE singleton`,
              )
            ).rows[0]?.ms ?? 0,
          );
          if (ms > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(ms, 3000)));
          await db.query(
            'UPDATE app_private.import_clock SET last_attempt_at=clock_timestamp() WHERE singleton',
          );
        },
      });
    } catch (error) {
      const code = error instanceof ImportError ? error.code : 'unavailable';
      await db.query(
        `UPDATE app_private.import_rows SET state='error',error_code=$3,retryable=true,completed_at=clock_timestamp() WHERE run_id=$1 AND row_number=$2`,
        [id, row.number, code],
      );
      return readRun(db, id);
    }
    await db.query('SAVEPOINT imported_row');
    try {
      const app = (
        await db.query<{ app: { id: string; state: string } }>(
          'SELECT app_private.import_app($1,$2) AS app',
          [metadata, row.proposal],
        )
      ).rows[0].app;
      await collectIcon(db, app.id, metadata.icon_url);
      await db.query(
        `UPDATE app_private.import_rows SET state=$3,app_id=$4,error_code=NULL,retryable=false,completed_at=clock_timestamp() WHERE run_id=$1 AND row_number=$2`,
        [id, row.number, app.state, app.id],
      );
      await db.query('RELEASE SAVEPOINT imported_row');
    } catch {
      await db.query('ROLLBACK TO SAVEPOINT imported_row');
      await db.query(
        `UPDATE app_private.import_rows SET state='error',error_code='storage',retryable=true,completed_at=clock_timestamp() WHERE run_id=$1 AND row_number=$2`,
        [id, row.number],
      );
    }
    return readRun(db, id);
  });
}

export async function retryImportRows(actor: string, id: string) {
  return database(actor, async (db) => {
    await db.query(
      `UPDATE app_private.import_rows SET state='pending',error_code=NULL,retryable=false,completed_at=NULL WHERE run_id=$1 AND state='error' AND retryable`,
      [id],
    );
    return readRun(db, id);
  });
}

export async function getImportProposals(actor: string, id: string) {
  return database(
    actor,
    async (db) =>
      (
        await db.query<{ id: string; proposal: Proposal }>(
          'SELECT id,proposal FROM app_private.import_proposals WHERE app_id=$1 ORDER BY created_at DESC,id LIMIT 50',
          [id],
        )
      ).rows,
  );
}
