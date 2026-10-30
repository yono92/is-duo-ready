import { describe, expect, it } from 'vitest';
import {
  assertExpansionBudget,
  chartCandidates,
  chartUrl,
  normalizeChart,
  normalizeGenreChart,
} from '../../scripts/lib/apple-charts';

const input = () => ({
  feed: {
    country: 'kr',
    id: chartUrl('top-free'),
    updated: 'Thu, 29 Oct 2026 23:34:42 +0000',
    results: [
      {
        id: '123',
        name: 'Test app',
        kind: 'apps',
        url: 'https://apps.apple.com/kr/app/test/id123',
      },
    ],
  },
});
describe('official KR chart boundary', () => {
  it('caps the combined catalogue at 1,000, accepts exact replay and rejects changed baselines', () => {
    const all = Array.from({ length: 1001 }, (_, i) => String(i + 1));
    const baseline = all.slice(0, 315);
    const selection = all.slice(315, 1000);
    expect(() => assertExpansionBudget(baseline, selection, 1000)).not.toThrow();
    expect(() => assertExpansionBudget(all.slice(0, 1000), selection, 1000)).not.toThrow();
    expect(() => assertExpansionBudget([...baseline, '1001'], selection, 1000)).toThrow();
    expect(() => assertExpansionBudget(baseline, selection.slice(1), 1000)).toThrow();
    expect(() => assertExpansionBudget(baseline, [...selection, '1001'], 1000)).toThrow();
  });
  it('validates legacy category self URL, Korean app identities and category scope', () => {
    const feed = {
      id: { label: chartUrl('top-free', '6000') },
      updated: { label: '2026-10-30T00:00:00Z' },
      entry: [
        {
          id: { label: 'https://apps.apple.com/kr/app/id123?uo=2', attributes: { 'im:id': '123' } },
          'im:name': { label: 'Test' },
        },
      ],
    };
    expect(normalizeGenreChart({ feed }, 'top-free', '6000', '2026-10-30')).toMatchObject({
      genreId: '6000',
      country: 'KR',
      entries: [{ appStoreId: '123', rank: 1 }],
    });
    expect(() => normalizeGenreChart({ feed }, 'top-free', '6007', '2026-10-30')).toThrow();
    feed.entry[0].id.label = 'https://apps.apple.com/us/app/id123';
    expect(() => normalizeGenreChart({ feed }, 'top-free', '6000', '2026-10-30')).toThrow();
  });
  it('takes equal category ranks, skips existing apps and deduplicates repeated candidates', () => {
    const first = normalizeChart(input(), 'top-free', '2026-10-30');
    first.entries.push({
      ...first.entries[0],
      appStoreId: '456',
      storeUrl: 'https://apps.apple.com/kr/app/id456',
      rank: 2,
    });
    const second = {
      ...first,
      entries: [
        { ...first.entries[0], appStoreId: '789', storeUrl: 'https://apps.apple.com/kr/app/id789' },
        first.entries[1],
      ],
    };
    expect(chartCandidates([first, second], [])).toEqual(['123', '789', '456']);
    expect(chartCandidates([first, second], ['123'])).toEqual(['789', '456']);
  });
  it('retains chart scope, observed time and Apple ordering separately from support', () => {
    const chart = normalizeChart(input(), 'top-free', '2026-10-30T00:00:00Z');
    expect(chart.entries[0]).toMatchObject({ appStoreId: '123', rank: 1 });
    expect(chart).toMatchObject({
      country: 'KR',
      kind: 'top-free',
      observedAt: '2026-10-30T00:00:00Z',
    });
    expect(chart.entries[0]).not.toHaveProperty('status');
  });
  it('rejects another country or chart rather than mixing ranks', () => {
    const value = input();
    value.feed.country = 'us';
    expect(() => normalizeChart(value, 'top-free', '2026-10-30')).toThrow();
    expect(() => normalizeChart(input(), 'top-paid', '2026-10-30')).toThrow();
  });
  it('rejects duplicate IDs, mismatched store IDs and invalid timestamps', () => {
    const value = input();
    value.feed.results.push(value.feed.results[0]);
    expect(() => normalizeChart(value, 'top-free', '2026-10-30')).toThrow();
    value.feed.results = [{ ...value.feed.results[0], url: 'https://apps.apple.com/kr/app/id999' }];
    expect(() => normalizeChart(value, 'top-free', '2026-10-30')).toThrow();
    expect(() => normalizeChart(input(), 'top-free', 'invalid')).toThrow();
  });
});
