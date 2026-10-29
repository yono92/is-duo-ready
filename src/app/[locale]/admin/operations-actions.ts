'use server';
import { revalidatePath } from 'next/cache';
import { assertAdmin, AdminError } from '@/lib/admin/auth';
import { InputError, uuid, revision } from '@/lib/admin/input';
import { database } from '@/lib/db/server';
import { runCollection } from '@/lib/collection/worker.mjs';
import { monitorUrl, CollectionError } from '@/lib/collection/web.mjs';
import { appleId } from '@/lib/import/apple.mjs';

export type OperationState = { error?: string; success?: string };
function safeError(error: unknown) {
  if (error instanceof AdminError) return error.code;
  if (error instanceof InputError || error instanceof CollectionError) return 'invalid';
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code === '40001') return 'conflict';
  if (code === '23514' || code === '23505') return 'invalid';
  if (code === '42501') return 'forbidden';
  return 'unavailable';
}
export async function operationAction(
  _previous: OperationState,
  form: FormData,
): Promise<OperationState> {
  let success = 'saved';
  try {
    const actor = await assertAdmin();
    const action = form.get('operation');
    if (action === 'createTarget') {
      const appId = uuid(form.get('app_id'));
      const kind = String(form.get('kind'));
      const note = String(form.get('approval_note') ?? '').trim();
      if (
        !['web', 'app_store'].includes(kind) ||
        form.get('confirmed') !== 'on' ||
        note.length < 1 ||
        note.length > 1000
      )
        throw new InputError('invalid');
      let url: URL;
      try {
        const raw = String(form.get('url'));
        url = monitorUrl(raw, new URL(raw).hostname);
      } catch {
        throw new InputError('invalid');
      }
      await database(actor, async (db) => {
        const app = (
          await db.query('SELECT app_store_id FROM app_private.apps WHERE id=$1', [appId])
        ).rows[0];
        if (!app) throw new InputError('invalid');
        if (kind === 'app_store') {
          if (appleId(url.toString()) !== app.app_store_id) throw new InputError('invalid');
          url = new URL(`https://apps.apple.com/kr/app/id${app.app_store_id}`);
        }
        await db.query(
          'INSERT INTO app_private.collection_targets(app_id,kind,url,approved_host,approval_note) VALUES($1,$2,$3,$4,$5)',
          [appId, kind, url.toString(), url.hostname, note],
        );
      });
    } else if (action === 'toggleTarget') {
      const enabled = form.get('enabled');
      if (!['true', 'false'].includes(String(enabled))) throw new InputError('invalid');
      await database(actor, async (db) => {
        const result = await db.query(
          'UPDATE app_private.collection_targets SET enabled=NOT enabled WHERE id=$1 AND enabled=$2 RETURNING id',
          [uuid(form.get('id')), enabled === 'true'],
        );
        if (!result.rowCount) throw Object.assign(new Error(), { code: '40001' });
      });
    } else if (action === 'collect') {
      const result = await runCollection(
        database,
        actor,
        form.get('id') ? uuid(form.get('id')) : null,
      );
      success = result.state;
    } else if (action === 'decide') {
      const decision = String(form.get('decision'));
      const reason = String(form.get('reason') ?? '').trim();
      if (
        !['approved', 'deferred', 'rejected'].includes(decision) ||
        reason.length < 1 ||
        reason.length > 4000 ||
        (decision === 'approved' && form.get('confirmed') !== 'on')
      )
        throw new InputError('invalid');
      await database(actor, (db) =>
        db.query('SELECT app_private.decide_review($1,$2,$3,$4,$5)', [
          uuid(form.get('id')),
          revision(Number(form.get('revision'))),
          decision,
          reason,
          decision === 'approved' ? revision(Number(form.get('app_revision'))) : null,
        ]),
      );
      if (decision === 'approved') {
        for (const lang of ['ko', 'en']) {
          revalidatePath(`/${lang}`);
          revalidatePath(`/${lang}/apps/[slug]`, 'page');
          revalidatePath(`/${lang}/updates`);
        }
        revalidatePath('/sitemap.xml');
      }
    } else if (action === 'link') {
      await database(actor, (db) =>
        db.query('SELECT app_private.link_submission($1,$2,$3)', [
          uuid(form.get('id')),
          revision(Number(form.get('revision'))),
          uuid(form.get('app_id')),
        ]),
      );
    } else throw new InputError('invalid');
  } catch (error) {
    return { error: safeError(error) };
  }
  revalidatePath('/[locale]/admin', 'layout');
  return { success };
}
