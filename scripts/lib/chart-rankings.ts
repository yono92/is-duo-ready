import type { DatabaseClient } from '../../src/lib/db/types.ts';
import { appleId } from '../../src/lib/import/apple.ts';
import { chartKinds, chartUrl, type ChartSnapshot } from './apple-charts.ts';

// Only the two overall KR charts are comparable for main-directory sorting.
// Genre charts remain discovery provenance; do not mix their ranks into these.
export function overallCharts(input: unknown): ChartSnapshot[] {
  const manifest = input as { version?: number; completedAt?: string; charts?: ChartSnapshot[] };
  if (
    manifest?.version !== 1 ||
    !Number.isFinite(Date.parse(manifest.completedAt ?? '')) ||
    !Array.isArray(manifest.charts)
  )
    throw new Error('A completed chart manifest is required.');
  return chartKinds.map((kind) => {
    const matches = manifest.charts!.filter((chart) => chart.kind === kind && !chart.genreId);
    if (matches.length !== 1) throw new Error('Both overall charts are required exactly once.');
    const chart = matches[0];
    if (
      chart.country !== 'KR' ||
      chart.sourceUrl !== chartUrl(kind) ||
      !Number.isFinite(Date.parse(chart.updatedAt)) ||
      !Number.isFinite(Date.parse(chart.observedAt)) ||
      !Array.isArray(chart.entries) ||
      chart.entries.length !== 100 ||
      new Set(chart.entries.map((entry) => entry.appStoreId)).size !== 100 ||
      chart.entries.some(
        (entry, index) => entry.rank !== index + 1 || appleId(entry.storeUrl) !== entry.appStoreId,
      )
    )
      throw new Error('Invalid overall KR chart.');
    return chart;
  });
}

// Call inside a transaction. Replacing both charts is atomic and never publishes
// apps or changes their support status, evidence, review dates or history.
export async function syncChartRankings(db: DatabaseClient, input: unknown) {
  const charts = overallCharts(input);
  await db.query("SELECT pg_advisory_xact_lock(hashtext('duo-ready-chart-rankings'))");
  const results = [];
  for (const chart of charts) {
    const current = (
      await db.query<{ latest: Date | null }>(
        "SELECT max(observed_at) AS latest FROM public.app_chart_rankings WHERE country='KR' AND chart_kind=$1",
        [chart.kind],
      )
    ).rows[0].latest;
    if (current && current.getTime() > Date.parse(chart.observedAt))
      throw new Error('Refusing to replace a newer chart observation.');
    await db.query("DELETE FROM public.app_chart_rankings WHERE country='KR' AND chart_kind=$1", [
      chart.kind,
    ]);
    const stored = await db.query(
      `INSERT INTO public.app_chart_rankings(app_id,chart_kind,rank,source_url,chart_updated_at,observed_at)
      SELECT a.id,$2,entry.rank,$3,$4,$5 FROM jsonb_to_recordset($1::jsonb) AS entry("appStoreId" text,rank integer)
      JOIN app_private.apps a ON a.app_store_id=entry."appStoreId"`,
      [
        JSON.stringify(chart.entries),
        chart.kind,
        chart.sourceUrl,
        chart.updatedAt,
        chart.observedAt,
      ],
    );
    results.push({
      kind: chart.kind,
      observedAt: chart.observedAt,
      sourceEntries: 100,
      stored: stored.rowCount,
    });
  }
  return results;
}
