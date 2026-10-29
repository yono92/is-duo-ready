import { appleId } from '@/lib/import/apple.ts';
import { InputError, publicSourceUrl } from '@/lib/admin/input';

export function parseSubmission(form: FormData) {
  const kind = form.get('kind');
  if (!['add', 'correction'].includes(String(kind)) || String(form.get('website') ?? '') !== '')
    throw new InputError('invalid');
  let appStoreId: string;
  try {
    appStoreId = appleId(form.get('store_url'));
  } catch {
    throw new InputError('invalid');
  }
  const rawBody = form.get('body');
  if (typeof rawBody !== 'string' || rawBody.includes('\0')) throw new InputError('invalid');
  const body = rawBody.trim();
  if (body.length < 10 || body.length > 4000) throw new InputError('invalid');
  return {
    kind: String(kind),
    app_store_id: appStoreId,
    store_url: `https://apps.apple.com/kr/app/id${appStoreId}`,
    body,
    evidence_url: publicSourceUrl(form.get('evidence_url')),
  };
}
export const reviewStates = ['pending', 'deferred', 'approved', 'rejected'] as const;
export type ReviewState = (typeof reviewStates)[number];
export function queueFilter(value?: string) {
  return reviewStates.includes(value as ReviewState) ? (value as ReviewState) : 'pending';
}
export function queuePage(value?: string) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 1000) : 1;
}
