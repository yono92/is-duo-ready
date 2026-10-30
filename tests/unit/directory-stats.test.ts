import { describe, expect, it } from 'vitest';
import { assertDirectoryStats, directoryStats } from '@/lib/directory/stats';
import { selectApps, defaultQuery } from '@/lib/directory/query';
import { fixtureApps } from '@/lib/data/fixtures';
import { statuses, type DirectoryApp } from '@/lib/directory/types';

describe('published KR support statistics', () => {
  it('reconciles mutually exclusive statuses and excludes drafts', () => {
    const source: DirectoryApp[] = statuses.map((status, index) => ({
      ...fixtureApps[index],
      status,
      publication: 'published' as const,
    }));
    source.push({ ...source[0], publication: 'draft' });
    expect(directoryStats(source)).toEqual({
      total: 4,
      supported: 1,
      planned: 1,
      unknown: 1,
      unsupported: 1,
    });
    expect(directoryStats([])).toEqual({
      total: 0,
      supported: 0,
      planned: 0,
      unknown: 0,
      unsupported: 0,
    });
  });
  it('keeps the global denominator when a search/filter has zero results', () => {
    const all = selectApps(fixtureApps, defaultQuery, 'ko');
    const empty = selectApps(
      fixtureApps,
      { ...defaultQuery, q: 'no-such-app', status: 'supported' },
      'en',
    );
    expect(empty.total).toBe(0);
    expect(empty.stats).toEqual(all.stats);
    expect(all.stats.total).toBe(30);
  });
  it('rejects inconsistent, non-finite, fractional and negative counts instead of showing a misleading zero', () => {
    const valid = { total: 10, supported: 2, planned: 1, unknown: 6, unsupported: 1 };
    for (const value of [
      { ...valid, total: 11 },
      { ...valid, unknown: -1 },
      { ...valid, supported: 2.5 },
      { ...valid, planned: NaN },
    ])
      expect(() => assertDirectoryStats(value)).toThrow('do not reconcile');
  });
});
