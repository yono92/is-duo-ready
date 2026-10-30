import { appleId } from '../../src/lib/import/apple.ts';

export const chartKinds = ['top-free', 'top-paid'] as const;
export type ChartKind = (typeof chartKinds)[number];
export const chartUrl = (kind: ChartKind, genreId?: string) => {
  if (genreId) {
    if (!/^60\d{2}$/.test(genreId)) throw new Error('Invalid genre ID.');
    return `https://itunes.apple.com/kr/rss/${kind === 'top-free' ? 'topfreeapplications' : 'toppaidapplications'}/limit=100/genre=${genreId}/json`;
  }
  return `https://rss.marketingtools.apple.com/api/v2/kr/apps/${kind}/100/apps.json`;
};

export type ChartSnapshot = {
  country: 'KR';
  kind: ChartKind;
  genreId?: string;
  sourceUrl: string;
  updatedAt: string;
  observedAt: string;
  entries: { appStoreId: string; name: string; rank: number; storeUrl: string }[];
};

export function normalizeChart(input: unknown, kind: ChartKind, observedAt: string): ChartSnapshot {
  const feed = (input as { feed?: Record<string, unknown> } | null)?.feed;
  if (
    !feed ||
    feed.country !== 'kr' ||
    feed.id !== chartUrl(kind) ||
    typeof feed.updated !== 'string' ||
    !Number.isFinite(Date.parse(feed.updated)) ||
    !Number.isFinite(Date.parse(observedAt)) ||
    !Array.isArray(feed.results) ||
    !feed.results.length ||
    feed.results.length > 100
  )
    throw new Error('Invalid KR app chart.');
  const ids = new Set<string>();
  const entries = feed.results.map((value: unknown, index: number) => {
    const row = value as Record<string, unknown> | null;
    if (
      !row ||
      row.kind !== 'apps' ||
      typeof row.id !== 'string' ||
      typeof row.name !== 'string' ||
      !row.name.trim() ||
      row.name.length > 200 ||
      appleId(row.url) !== row.id ||
      ids.has(row.id)
    )
      throw new Error('Invalid chart app.');
    ids.add(row.id);
    return {
      appStoreId: row.id,
      name: row.name,
      rank: index + 1,
      storeUrl: `https://apps.apple.com/kr/app/id${row.id}`,
    };
  });
  return {
    country: 'KR' as const,
    kind,
    sourceUrl: chartUrl(kind),
    updatedAt: new Date(feed.updated).toISOString(),
    observedAt,
    entries,
  };
}

export function normalizeGenreChart(
  input: unknown,
  kind: ChartKind,
  genreId: string,
  observedAt: string,
): ChartSnapshot {
  const feed = (
    input as {
      feed?: { id?: { label?: string }; updated?: { label?: string }; entry?: unknown[] };
    } | null
  )?.feed;
  if (
    !feed ||
    feed.id?.label !== chartUrl(kind, genreId) ||
    !Number.isFinite(Date.parse(feed.updated?.label ?? '')) ||
    !Number.isFinite(Date.parse(observedAt))
  )
    throw new Error('Invalid official KR genre chart.');
  const values = feed.entry ?? [];
  if (!Array.isArray(values) || values.length > 100) throw new Error('Invalid chart size.');
  const ids = new Set<string>();
  const entries = values.map((value: unknown, index: number) => {
    const entry = value as {
      id?: { label?: string; attributes?: { 'im:id'?: string } };
      'im:name'?: { label?: string };
    } | null;
    const appStoreId = entry?.id?.attributes?.['im:id'];
    const name = entry?.['im:name']?.label;
    if (
      !appStoreId ||
      !name?.trim() ||
      name.length > 200 ||
      appleId(entry?.id?.label) !== appStoreId ||
      ids.has(appStoreId)
    )
      throw new Error('Invalid chart app.');
    ids.add(appStoreId);
    return {
      appStoreId,
      name,
      rank: index + 1,
      storeUrl: `https://apps.apple.com/kr/app/id${appStoreId}`,
    };
  });
  return {
    country: 'KR',
    kind,
    genreId,
    sourceUrl: chartUrl(kind, genreId),
    updatedAt: new Date(feed.updated!.label!).toISOString(),
    observedAt,
    entries,
  };
}

export function chartCandidates(charts: ChartSnapshot[], excluded: string[]) {
  const seen = new Set(excluded);
  const candidates: string[] = [];
  // Take equal ranks across categories before proceeding deeper into any single chart.
  for (
    let index = 0;
    index < Math.max(0, ...charts.map((chart) => chart.entries.length));
    index++
  ) {
    for (const chart of charts) {
      const entry = chart.entries[index];
      if (entry && !seen.has(entry.appStoreId)) {
        seen.add(entry.appStoreId);
        candidates.push(entry.appStoreId);
      }
    }
  }
  return candidates;
}

export function assertExpansionBudget(
  currentIds: string[],
  selectedIds: string[],
  targetTotal: number,
) {
  const current = new Set(currentIds);
  if (
    targetTotal !== 1000 ||
    current.size !== currentIds.length ||
    new Set(selectedIds).size !== selectedIds.length ||
    current.size + selectedIds.filter((id) => !current.has(id)).length !== targetTotal
  )
    throw new Error('Database changed or requested total would be exceeded.');
}
