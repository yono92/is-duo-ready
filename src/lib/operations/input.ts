import { appleId } from '@/lib/import/apple.ts';
import { InputError, publicSourceUrl } from '@/lib/admin/input';
import type { UsageDetails } from './usage-types';

function usageText(form: FormData, key: string, max = 80) {
  const value = form.get(key);
  if (typeof value !== 'string' || value.includes('\0')) throw new InputError('invalid');
  const text = value.trim();
  if (!text || text.length > max) throw new InputError('invalid');
  return text;
}

function usageDetails(form: FormData): UsageDetails {
  const environment = usageText(form, 'environment');
  const displayMode = usageText(form, 'display_mode');
  const result = usageText(form, 'result');
  const observedOn = usageText(form, 'observed_on', 10);
  const observed = new Date(`${observedOn}T00:00:00.000Z`);
  if (
    !['device', 'simulator'].includes(environment) ||
    !['unfolded', 'folded', 'transition'].includes(displayMode) ||
    !['works', 'issues'].includes(result) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(observedOn) ||
    !Number.isFinite(observed.getTime()) ||
    observed.toISOString().slice(0, 10) !== observedOn ||
    observed.getTime() > Date.now() + 14 * 60 * 60 * 1000
  )
    throw new InputError('invalid');
  return {
    device_model: usageText(form, 'device_model'),
    environment: environment as UsageDetails['environment'],
    os_version: usageText(form, 'os_version'),
    app_version: usageText(form, 'app_version'),
    display_mode: displayMode as UsageDetails['display_mode'],
    result: result as UsageDetails['result'],
    observed_on: observedOn,
  };
}

export function parseSubmission(form: FormData) {
  const kind = form.get('kind');
  if (
    !['add', 'correction', 'usage'].includes(String(kind)) ||
    String(form.get('website') ?? '') !== ''
  )
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
  const common = {
    kind: String(kind),
    app_store_id: appStoreId,
    store_url: `https://apps.apple.com/kr/app/id${appStoreId}`,
    body,
  };
  if (kind !== 'usage')
    return { ...common, evidence_url: publicSourceUrl(form.get('evidence_url')) };
  const locale = form.get('locale');
  if (form.get('publish_consent') !== 'on' || !['ko', 'en'].includes(String(locale)))
    throw new InputError('invalid');
  const url = form.get('evidence_url');
  return {
    ...common,
    evidence_url: url === null || url === '' ? null : publicSourceUrl(url),
    usage: usageDetails(form),
    locale: locale as 'ko' | 'en',
    publish_consent: true,
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
