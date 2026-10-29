'use server';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { database } from '@/lib/db/server';
import { dataSource } from '@/lib/data/directory';
import { parseSubmission } from '@/lib/operations/input';
import { InputError } from '@/lib/admin/input';
export type SubmissionState = { error?: string; received?: boolean };
export async function submitAction(
  _previous: SubmissionState,
  form: FormData,
): Promise<SubmissionState> {
  try {
    if (dataSource() !== 'postgres') return { error: 'unavailable' };
    const input = parseSubmission(form);
    const jar = await cookies();
    let visitor = jar.get('duo-submission-visitor')?.value;
    if (!visitor || !/^[a-f0-9]{64}$/.test(visitor)) {
      visitor = randomBytes(32).toString('hex');
      jar.set('duo-submission-visitor', visitor, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 3600,
      });
    }
    await database(null, (db) =>
      db.query('SELECT submission_ingress.accept($1,$2)', [
        input,
        createHash('sha256').update(visitor).digest('hex'),
      ]),
    );
    return { received: true };
  } catch (error) {
    if (
      error instanceof InputError ||
      (error && typeof error === 'object' && 'code' in error && error.code === '23514')
    )
      return { error: 'invalid' };
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P0429')
      return { error: 'rateLimited' };
    return { error: 'unavailable' };
  }
}
