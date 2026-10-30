// Read-only Apple collection. Importing/publishing remains an explicit separate operation.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import {
  chartCandidates,
  chartKinds,
  chartUrl,
  normalizeChart,
  normalizeGenreChart,
  type ChartSnapshot,
} from './lib/apple-charts.ts';
import {
  categoryIds,
  ImportError,
  lookupApple,
  lookupAppleBatch,
} from '../src/lib/import/apple.ts';

type Observation = {
  appStoreId: string;
  metadata?: Awaited<ReturnType<typeof lookupApple>>;
  error?: string;
};
type Manifest = {
  version: 1;
  startedAt: string;
  completedAt?: string;
  charts: ChartSnapshot[];
  observations: Observation[];
  targetTotal?: number;
  baselineAppStoreIds?: string[];
  selectedAppStoreIds?: string[];
  lookupFailures?: Observation[];
};

async function saveManifest(path: string, manifest: Manifest) {
  await writeFile(path + '.tmp', JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600 });
  await rename(path + '.tmp', path);
}

try {
  const args = process.argv.slice(2);
  if (
    args.some((arg) => !/^--(source|target-total|existing)=.+$/.test(arg)) ||
    new Set(args.map((arg) => arg.split('=')[0])).size !== args.length
  )
    throw new Error(
      'Use --source=docs/data/name.json [--target-total=1000 --existing=.data/ids.json].',
    );
  const argument = (name: string) =>
    args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const path = argument('source') ?? '';
  if (!/^docs\/data\/[a-z0-9-]+\.json$/.test(path)) throw new Error('Use docs/data/*.json.');
  const targetTotal = argument('target-total') ? Number(argument('target-total')) : undefined;
  const existingPath = argument('existing');
  if (
    (targetTotal !== undefined && targetTotal !== 1000) ||
    (targetTotal !== undefined) !== !!existingPath
  )
    throw new Error('Expansion requires --target-total=1000 and --existing=path.');
  const baseline: string[] = existingPath ? JSON.parse(await readFile(existingPath, 'utf8')) : [];
  if (
    !Array.isArray(baseline) ||
    new Set(baseline).size !== baseline.length ||
    baseline.some((id) => typeof id !== 'string' || !/^[1-9][0-9]{0,19}$/.test(id)) ||
    (targetTotal && baseline.length >= targetTotal)
  )
    throw new Error('Invalid existing app IDs.');
  await mkdir('docs/data', { recursive: true });
  let manifest: Manifest;
  try {
    manifest = JSON.parse(await readFile(path, 'utf8')) as Manifest;
    if (
      manifest.version !== 1 ||
      !Array.isArray(manifest.charts) ||
      manifest.targetTotal !== targetTotal ||
      (targetTotal && JSON.stringify(manifest.baselineAppStoreIds) !== JSON.stringify(baseline)) ||
      !Array.isArray(manifest.observations)
    )
      throw new Error('Invalid existing manifest.');
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT')
      throw error;
    manifest = {
      version: 1,
      startedAt: new Date().toISOString(),
      charts: [],
      observations: [],
      ...(targetTotal ? { targetTotal, baselineAppStoreIds: baseline } : {}),
    };
    await saveManifest(path, manifest);
  }
  const genres = targetTotal ? Object.keys(categoryIds) : [undefined];
  for (const genreId of genres) {
    for (const kind of chartKinds) {
      if (manifest.charts.some((chart) => chart.kind === kind && chart.genreId === genreId))
        continue;
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const response = await fetch(chartUrl(kind, genreId), {
        redirect: 'error',
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error('Chart request failed.');
      const body = await response.text();
      if (Buffer.byteLength(body) > 4194304) throw new Error('Chart too large.');
      const observedAt = new Date().toISOString();
      manifest.charts.push(
        genreId
          ? normalizeGenreChart(JSON.parse(body), kind, genreId, observedAt)
          : normalizeChart(JSON.parse(body), kind, observedAt),
      );
      await saveManifest(path, manifest);
      console.log(
        `Chart ${manifest.charts.length}/${genres.length * 2}: ${genreId ?? 'all'} ${kind}`,
      );
    }
  }
  const ids = chartCandidates(manifest.charts, baseline);
  const needed = targetTotal ? targetTotal - baseline.length : ids.length;
  const pending = ids.filter(
    (id) => !manifest.observations.some((row) => row.appStoreId === id && row.metadata),
  );
  let successful = manifest.observations.filter((row) => row.metadata).length;
  for (let offset = 0; offset < pending.length && successful < needed;) {
    const batch = pending.slice(offset, offset + Math.min(20, needed - successful));
    offset += batch.length;
    let observations: Observation[];
    try {
      observations = await lookupAppleBatch(batch);
    } catch {
      observations = [];
      for (const appStoreId of batch) {
        try {
          observations.push({ appStoreId, metadata: await lookupApple(appStoreId) });
        } catch (error) {
          observations.push({
            appStoreId,
            error: error instanceof ImportError ? error.code : 'unavailable',
          });
        }
      }
    }
    manifest.observations = manifest.observations.filter((row) => !batch.includes(row.appStoreId));
    manifest.observations.push(...observations);
    successful = manifest.observations.filter((row) => row.metadata).length;
    await saveManifest(path, manifest);
    console.log(`${successful}/${needed}: collected`);
  }
  if (successful !== needed) throw new Error('Not enough verified KR apps; manifest is resumable.');
  if (targetTotal) {
    manifest.lookupFailures = [
      ...(manifest.lookupFailures ?? []),
      ...manifest.observations.filter((row) => row.error),
    ];
    manifest.observations = manifest.observations.filter((row) => row.metadata);
    manifest.selectedAppStoreIds = manifest.observations.map((row) => row.appStoreId);
  }
  manifest.completedAt ??= new Date().toISOString();
  await saveManifest(path, manifest);
  const ready = manifest.observations.filter((row) => row.metadata);
  await writeFile(
    path.replace(/\.json$/, '.csv'),
    'app_store_url\n' + ready.map((row) => row.metadata!.store_url).join('\n') + '\n',
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      charts: manifest.charts.map((chart) => ({ kind: chart.kind, count: chart.entries.length })),
      uniqueApps: ids.length,
      collected: ready.length,
      failed:
        (manifest.lookupFailures?.length ?? 0) +
        manifest.observations.filter((row) => row.error).length,
      ...(targetTotal ? { targetTotal, existing: baseline.length, selected: needed } : {}),
      source: path,
      databaseWrites: 0,
    }),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Chart collection failed.');
  process.exitCode = 1;
}
