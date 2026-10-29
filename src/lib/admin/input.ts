import {
  categories,
  locales,
  statuses,
  type Category,
  type Locale,
  type SupportStatus,
} from '@/lib/directory/types';

export type AdminEvidence = {
  url: string;
  title: string;
  kind: 'app_store' | 'developer' | 'apple';
  quote: string;
  official_confirmed: boolean;
  announced_at: string;
  support_version: string;
  features: { key: string; description: string }[];
};
export type AdminDraft = {
  id?: string;
  icon_url?: string | null;
  revision?: number;
  publication?: string;
  app_store_id: string;
  slug: string;
  name: string;
  developer: string;
  category: Category | '';
  aliases: string[];
  original_locale: Locale;
  status: SupportStatus;
  current_version: string;
  release_notes: string;
  support_version: string;
  investigation_reason: string;
  translations: Partial<
    Record<Locale, { name: string; summary: string; state: 'current' | 'needs-review' }>
  >;
  evidence: AdminEvidence[];
};

export const emptyDraft: AdminDraft = {
  app_store_id: '',
  slug: '',
  name: '',
  developer: '',
  category: '',
  aliases: [],
  original_locale: 'ko',
  status: 'unknown',
  current_version: '',
  release_notes: '',
  support_version: '',
  investigation_reason: '',
  translations: {
    ko: { name: '', summary: '', state: 'current' },
    en: { name: '', summary: '', state: 'current' },
  },
  evidence: [],
};

export class InputError extends Error {}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('invalid');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
    throw new InputError('invalid');
  return value.trim();
}
function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (!allowed.includes(value as T)) throw new InputError('invalid');
  return value as T;
}
export function publicSourceUrl(value: unknown) {
  const raw = text(value, 2000, true);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new InputError('invalid');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.hash ||
    !/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) ||
    /(?:^|\.)(localhost|local|internal|test|invalid)$/i.test(url.hostname)
  )
    throw new InputError('invalid');
  return url.toString();
}
export function uuid(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value))
    throw new InputError('invalid');
  return value;
}
export function revision(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new InputError('invalid');
  return Number(value);
}

export function parseDraft(raw: unknown): AdminDraft {
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > 524288)
    throw new InputError('invalid');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InputError('invalid');
  }
  const data = object(parsed);
  const appStoreId = text(data.app_store_id, 20, true);
  const slug = text(data.slug, 150, true);
  if (!/^[1-9][0-9]*$/.test(appStoreId) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
    throw new InputError('invalid');
  if (
    !Array.isArray(data.aliases) ||
    data.aliases.length > 50 ||
    !Array.isArray(data.evidence) ||
    data.evidence.length > 50
  )
    throw new InputError('invalid');
  const translations: AdminDraft['translations'] = {};
  for (const [key, value] of Object.entries(object(data.translations))) {
    const locale = oneOf(key, locales);
    const item = object(value);
    const name = text(item.name, 200);
    const summary = text(item.summary, 4000);
    if (!name && !summary) continue;
    if (!name) throw new InputError('invalid');
    translations[locale] = { name, summary, state: oneOf(item.state, ['current', 'needs-review']) };
  }
  return {
    ...(data.id ? { id: uuid(data.id), revision: revision(data.revision) } : {}),
    app_store_id: appStoreId,
    slug,
    name: text(data.name, 200, true),
    developer: text(data.developer, 200, true),
    category: oneOf(data.category, [...categories, '']),
    aliases: data.aliases.map((item) => text(item, 100, true)),
    original_locale: oneOf(data.original_locale, locales),
    status: oneOf(data.status, statuses),
    current_version: text(data.current_version, 100),
    release_notes: text(data.release_notes, 20000),
    support_version: text(data.support_version, 100),
    investigation_reason: text(data.investigation_reason, 4000),
    translations,
    evidence: data.evidence.map((value) => {
      const item = object(value);
      const date = text(item.announced_at, 10);
      if (
        date &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(Date.parse(date)) ||
          new Date(date).toISOString().slice(0, 10) !== date)
      )
        throw new InputError('invalid');
      if (
        typeof item.official_confirmed !== 'boolean' ||
        !Array.isArray(item.features) ||
        item.features.length > 20
      )
        throw new InputError('invalid');
      return {
        url: publicSourceUrl(item.url),
        title: text(item.title, 500, true),
        kind: oneOf(item.kind, ['app_store', 'developer', 'apple']),
        quote: text(item.quote, 4000, true),
        official_confirmed: item.official_confirmed,
        announced_at: date,
        support_version: text(item.support_version, 100),
        features: item.features.map((value) => {
          const feature = object(value);
          const key = text(feature.key, 50, true);
          if (!/^[a-z][a-z0-9-]*$/.test(key)) throw new InputError('invalid');
          return { key, description: text(feature.description, 1000, true) };
        }),
      };
    }),
  };
}
