import type { ActorDatabase } from '../db/types.ts';
import { lookupApple, ImportError } from '../import/apple.ts';
import { fetchOfficial, CollectionError } from './web.ts';

/** Shared by server-only UI and the local CLI. db is a verified-actor transaction wrapper.
 */
export async function runCollection(
  database: ActorDatabase,
  actor: string,
  targetId: string | null = null,
  options: { appleLookup?: typeof lookupApple; webLookup?: typeof fetchOfficial } = {},
) {
  const job = await database(
    actor,
    async (db) =>
      (await db.query('SELECT app_private.claim_collection($1) AS job', [targetId])).rows[0].job,
  );
  if (!job) return { state: 'idle' };
  let payload = null;
  let code: string | null = null;
  try {
    payload = await database(actor, async (db) => {
      // Same lock and clock as the 004 importer. Serializes Apple requests across entry points.
      if (!(await db.query('SELECT pg_try_advisory_xact_lock(409,4) AS locked')).rows[0].locked)
        throw new CollectionError('busy');
      const beforeAttempt = async () => {
        await database(actor, async (record) => {
          const updated = await record.query(
            `UPDATE app_private.collection_runs SET attempts=attempts+1 WHERE id=$1 AND token=$2 AND state='running' AND attempts<3 RETURNING id`,
            [job.run_id, job.token],
          );
          if (!updated.rowCount) throw new CollectionError('interrupted');
        });
        const ms = Number(
          (
            await db.query(
              `SELECT greatest(0,3000-extract(epoch FROM (clock_timestamp()-last_attempt_at))*1000) AS ms FROM app_private.import_clock WHERE singleton`,
            )
          ).rows[0]?.ms ?? 0,
        );
        if (ms > 0) await new Promise((r) => setTimeout(r, Math.min(ms, 3000)));
        await db.query(
          'UPDATE app_private.import_clock SET last_attempt_at=clock_timestamp() WHERE singleton',
        );
      };
      try {
        if (job.kind === 'app_store') {
          if (
            job.approved_host !== 'apps.apple.com' ||
            job.url !== `https://apps.apple.com/kr/app/id${job.app_store_id}`
          )
            throw new CollectionError('invalid');
          const data = await (options.appleLookup ?? lookupApple)(job.app_store_id, {
            beforeAttempt,
          });
          const { fetched_at, ...content } = data;
          void fetched_at;
          return { ...content, source_url: job.url };
        }
        return await (options.webLookup ?? fetchOfficial)(job.url, job.approved_host, {
          beforeAttempt,
        });
      } catch (error) {
        // Keep the attempt clock committed even after a fast upstream failure.
        code =
          error instanceof CollectionError || error instanceof ImportError
            ? error.code
            : 'unavailable';
        return null;
      }
    });
  } catch (error) {
    code =
      error instanceof CollectionError || error instanceof ImportError ? error.code : 'unavailable';
  }
  await database(actor, (db) =>
    db.query('SELECT app_private.finish_collection($1,$2,$3,$4)', [
      job.run_id,
      job.token,
      payload,
      code,
    ]),
  );
  return { state: code ? 'failed' : 'succeeded', error: code };
}
