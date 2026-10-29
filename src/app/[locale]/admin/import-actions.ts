'use server';

import { revalidatePath } from 'next/cache';
import { AdminError, assertAdmin } from '@/lib/admin/auth';
import { uuid } from '@/lib/admin/input';
import { parseImport } from '@/lib/import/input';
import { ImportError } from '@/lib/import/apple.ts';
import {
  createImportRun,
  processImportRow,
  retryImportRows,
  type ImportRun,
} from '@/lib/import/repository';

export type ImportActionState = { run?: ImportRun; error?: string };
function safeError(error: unknown) {
  if (error instanceof ImportError || error instanceof AdminError) return error.code;
  return 'unavailable';
}
export async function createImportAction(
  _previous: ImportActionState,
  form: FormData,
): Promise<ImportActionState> {
  try {
    const actor = await assertAdmin();
    let raw = form.get('input');
    const mode = form.get('mode');
    const file = form.get('file');
    if (mode === 'csv' && file instanceof File && file.size) {
      if (file.size > 524288) throw new ImportError('tooLarge');
      try {
        raw = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      } catch {
        throw new ImportError('invalidEncoding');
      }
    }
    const run = await createImportRun(actor, parseImport(raw, mode));
    revalidatePath('/[locale]/admin/apps/import', 'page');
    return { run };
  } catch (error) {
    return { error: safeError(error) };
  }
}
export async function continueImportAction(id: string): Promise<ImportActionState> {
  try {
    const actor = await assertAdmin();
    const run = await processImportRow(actor, uuid(id));
    revalidatePath('/[locale]/admin/apps', 'page');
    return { run };
  } catch (error) {
    return { error: safeError(error) };
  }
}
export async function retryImportAction(id: string): Promise<ImportActionState> {
  try {
    return { run: await retryImportRows(await assertAdmin(), uuid(id)) };
  } catch (error) {
    return { error: safeError(error) };
  }
}
