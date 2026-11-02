import { chartKinds, chartUrl } from '../../scripts/lib/apple-charts.ts';

// Synthetic chart positions for isolated test databases only, never product data.
export function fictionalCharts(
  freeIds: string[],
  paidIds: string[],
  observedAt = '2026-11-02T00:00:00.000Z',
) {
  return {
    version: 1,
    completedAt: observedAt,
    charts: chartKinds.map((kind, kindIndex) => ({
      country: 'KR',
      kind,
      sourceUrl: chartUrl(kind),
      updatedAt: observedAt,
      observedAt,
      entries: [
        ...(kind === 'top-free' ? freeIds : paidIds),
        ...Array.from({ length: 100 }, (_, index) => `990099${kindIndex}${1000 + index}`),
      ]
        .slice(0, 100)
        .map((appStoreId, index) => ({
          appStoreId,
          rank: index + 1,
          name: 'Fictional chart fixture',
          storeUrl: `https://apps.apple.com/kr/app/id${appStoreId}`,
        })),
    })),
  };
}
