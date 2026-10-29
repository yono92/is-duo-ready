import type { DatabaseClient } from '../../src/lib/db/types.ts';
export interface ContentSnapshot {
  version: 1;
  createdAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}
import { createHash } from 'node:crypto';

// Content/provenance only. Auth/admin identities, visitor submissions and worker leases stay local.
export const contentTables = [
  'app_private.apps',
  'app_private.sources',
  'app_private.evidence',
  'app_private.app_translations',
  'app_private.app_store_listings',
  'app_private.app_support',
  'app_private.app_evidence',
  'app_private.support_features',
  'app_private.slug_redirects',
  'app_private.review_events',
  'public.directory_entries',
  'public.support_history',
  'public.app_icon_assets',
  'app_private.import_runs',
  'app_private.import_rows',
  'app_private.import_proposals',
];
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  return value;
}
export function rowsHash(rows: Record<string, unknown>[]) {
  return createHash('sha256')
    .update(JSON.stringify(rows.map((row) => JSON.stringify(canonical(row))).sort()))
    .digest('hex');
}
export async function contentSnapshot(db: DatabaseClient): Promise<ContentSnapshot> {
  const tables: ContentSnapshot['tables'] = {};
  for (const table of contentTables)
    tables[table] = (await db.query(`SELECT to_jsonb(t) AS row FROM ${table} t`)).rows.map(
      (item) => item.row,
    );
  return { version: 1, createdAt: new Date().toISOString(), tables };
}
export function validateSnapshot(input: unknown): asserts input is ContentSnapshot {
  const snapshot = input as Partial<ContentSnapshot> | null;
  if (
    snapshot?.version !== 1 ||
    !snapshot.tables ||
    Object.keys(snapshot.tables).length !== contentTables.length ||
    contentTables.some(
      (t) =>
        !Array.isArray(snapshot.tables![t]) ||
        snapshot.tables![t].length > 100000 ||
        snapshot.tables![t].some((row) => !row || typeof row !== 'object' || Array.isArray(row)),
    )
  )
    throw new Error('Invalid content manifest.');
}
export function transferSummary(snapshot: unknown) {
  validateSnapshot(snapshot);
  return Object.fromEntries(
    contentTables.map((t) => [
      t,
      { rows: snapshot.tables![t].length, sha256: rowsHash(snapshot.tables![t]) },
    ]),
  );
}
export async function transferContent(db: DatabaseClient, snapshot: unknown, apply = false) {
  validateSnapshot(snapshot);
  await db.query('BEGIN');
  try {
    if (apply) await db.query(`LOCK TABLE ${contentTables.join(',')} IN SHARE ROW EXCLUSIVE MODE`);
    const before = await contentSnapshot(db);
    if (contentTables.every((t) => rowsHash(before.tables[t]) === rowsHash(snapshot.tables![t]))) {
      await db.query('COMMIT');
      return { status: 'identical', tables: transferSummary(snapshot) };
    }
    if (contentTables.some((t) => before.tables[t].length))
      throw new Error('Target is not empty or identical.');
    if (!apply) {
      await db.query('ROLLBACK');
      return { status: 'dry-run', tables: transferSummary(snapshot) };
    }
    for (const table of contentTables) {
      if (snapshot.tables[table].length)
        await db.query(
          `INSERT INTO ${table} SELECT * FROM jsonb_populate_recordset(NULL::${table},$1::jsonb)`,
          [JSON.stringify(snapshot.tables[table])],
        );
    }
    const after = await contentSnapshot(db);
    if (contentTables.some((t) => rowsHash(after.tables[t]) !== rowsHash(snapshot.tables![t])))
      throw new Error('Transfer verification mismatch.');
    await db.query('COMMIT');
    return { status: 'copied', tables: transferSummary(after) };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
