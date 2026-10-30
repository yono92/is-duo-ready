import { categories, statuses, type DirectoryApp, type DirectoryQuery, type Locale } from './types';
import { directoryStats } from './stats';
export const PAGE_SIZE = 24;
export const defaultQuery: DirectoryQuery = {
  q: '',
  category: 'all',
  status: 'all',
  sort: 'recommended',
  page: 1,
};
export type RawQuery = Record<string, string | string[] | undefined>;
export function parseQuery(raw: RawQuery): DirectoryQuery {
  const get = (key: string) => (Array.isArray(raw[key]) ? raw[key][0] : raw[key]);
  // Keep links shared before the App Store taxonomy correction useful.
  const rawCategory = get('category');
  const category = rawCategory === 'creativity' ? 'graphics-design' : rawCategory;
  const status = get('status');
  const sort = get('sort');
  const page = Number(get('page'));
  return {
    q: (get('q') ?? '').normalize('NFC').trim().slice(0, 100),
    category: categories.includes(category as never)
      ? (category as DirectoryQuery['category'])
      : 'all',
    status: statuses.includes(status as never) ? (status as DirectoryQuery['status']) : 'all',
    sort: sort === 'name' || sort === 'updated' ? sort : 'recommended',
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1,
  };
}
export function queryString(query: DirectoryQuery): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(defaultQuery) as (keyof DirectoryQuery)[]) {
    if (query[key] !== defaultQuery[key]) params.set(key, String(query[key]));
  }
  return params.toString();
}
export function changeQuery(query: DirectoryQuery, patch: Partial<DirectoryQuery>) {
  return { ...query, ...patch, page: patch.page ?? 1 };
}
export function selectApps(apps: DirectoryApp[], query: DirectoryQuery, locale: Locale) {
  const needle = query.q.toLocaleLowerCase().normalize('NFC');
  const matched = apps.filter(
    (app) =>
      app.publication === 'published' &&
      app.country === 'KR' &&
      (query.category === 'all' || app.category === query.category) &&
      (query.status === 'all' || app.status === query.status) &&
      [...Object.values(app.names), ...app.aliases].some((name) =>
        name.normalize('NFC').toLocaleLowerCase().includes(needle),
      ),
  );
  const date = (value: string | null) => (value ? Date.parse(value) : 0);
  const collator = new Intl.Collator(locale);
  matched.sort((a, b) => {
    if (query.sort === 'recommended') {
      const statusOrder = statuses.indexOf(a.status) - statuses.indexOf(b.status);
      if (statusOrder) return statusOrder;
      const review = date(b.reviewedAt) - date(a.reviewedAt);
      if (review) return review;
    }
    if (query.sort === 'updated') {
      const updated = date(b.supportChangedAt) - date(a.supportChangedAt);
      if (updated) return updated;
    }
    return collator.compare(a.names[locale], b.names[locale]) || a.slug.localeCompare(b.slug);
  });
  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(query.page, pages);
  return {
    apps: matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: matched.length,
    page,
    pages,
    stats: directoryStats(apps),
  };
}
