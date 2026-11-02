import { expect, test } from 'vitest';
import { overallCharts } from '../../scripts/lib/chart-rankings';
import { fictionalCharts } from '../fixtures/chart-rankings';

test('accepts complete, separate KR overall charts without mixing genre ranks', () => {
  const input = fictionalCharts(['99008201'], ['99008202']);
  input.charts.push({ ...input.charts[0], genreId: '6011' } as (typeof input.charts)[number]);
  expect(overallCharts(input)).toHaveLength(2);
  expect(overallCharts(input)[0].entries[0].appStoreId).toBe('99008201');
  expect(overallCharts(input)[1].entries[0].appStoreId).toBe('99008202');
});

test('rejects incomplete, repeated, foreign, misidentified or invalid chart observations', () => {
  const valid = fictionalCharts([], []);
  for (const alter of [
    (d: typeof valid) => {
      d.charts.pop();
    },
    (d: typeof valid) => {
      d.charts.push(d.charts[0]);
    },
    (d: typeof valid) => {
      d.charts[0].entries.pop();
    },
    (d: typeof valid) => {
      d.charts[0].country = 'US';
    },
    (d: typeof valid) => {
      d.charts[0].sourceUrl = 'https://example.com/chart';
    },
    (d: typeof valid) => {
      d.charts[0].observedAt = 'invalid';
    },
    (d: typeof valid) => {
      d.charts[0].entries[1].rank = 1;
    },
    (d: typeof valid) => {
      d.charts[0].entries[1] = d.charts[0].entries[0];
    },
    (d: typeof valid) => {
      d.charts[0].entries[0].storeUrl = 'https://apps.apple.com/kr/app/id123';
    },
  ]) {
    const input = structuredClone(valid);
    alter(input);
    expect(() => overallCharts(input)).toThrow();
  }
  expect(() => overallCharts(null)).toThrow();
});
