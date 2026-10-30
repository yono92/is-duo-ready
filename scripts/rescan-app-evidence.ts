// Read-only KR Lookup refresh. Keyword hits are review candidates, never support decisions.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ImportError, lookupAppleBatch } from '../src/lib/import/apple.ts';

type Baseline = { apps: { app_store_id: string }[] };
type Observation = Awaited<ReturnType<typeof lookupAppleBatch>>[number] & {
  description?: string | null;
  developerUrl?: string | null;
  versionReleasedAt?: string | null;
  keywords?: string[];
};
type Manifest = {
  version: 1;
  baselineHash: string;
  country: 'KR';
  startedAt: string;
  completedAt?: string;
  scope: string;
  observations: Observation[];
};

async function save(path: string, manifest: Manifest) {
  await writeFile(path + '.tmp', JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600 });
  await rename(path + '.tmp', path);
}

try {
  const args = process.argv.slice(2);
  if (
    args.length !== 2 ||
    args.some((arg) => !/^--(baseline|source)=[a-zA-Z0-9_./-]+\.json$/.test(arg)) ||
    new Set(args.map((arg) => arg.split('=')[0])).size !== 2
  )
    throw new Error('Use --baseline=.data/path.json --source=docs/data/name.json.');
  const baselinePath = args.find((arg) => arg.startsWith('--baseline='))!.slice(11);
  const path = args.find((arg) => arg.startsWith('--source='))!.slice(9);
  if (!baselinePath.startsWith('.data/') || !/^docs\/data\/[a-z0-9-]+\.json$/.test(path))
    throw new Error('Use a private baseline and a new docs/data manifest.');
  const baselineText = await readFile(baselinePath, 'utf8');
  const baseline = JSON.parse(baselineText) as Baseline;
  const ids = baseline.apps.map((app) => app.app_store_id);
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !/^[1-9][0-9]{0,19}$/.test(id))
  )
    throw new Error('Invalid baseline app identities.');
  const baselineHash = createHash('sha256').update(baselineText).digest('hex');
  let manifest: Manifest;
  try {
    manifest = JSON.parse(await readFile(path, 'utf8')) as Manifest;
    if (
      manifest.version !== 1 ||
      manifest.baselineHash !== baselineHash ||
      !Array.isArray(manifest.observations)
    )
      throw new Error('Existing manifest belongs to a different baseline.');
    if (
      new Set(manifest.observations.map((row) => row.appStoreId)).size !==
        manifest.observations.length ||
      manifest.observations.some((row) => !ids.includes(row.appStoreId))
    )
      throw new Error('Invalid existing observation identities.');
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'))
      throw error;
    manifest = {
      version: 1,
      baselineHash,
      country: 'KR',
      startedAt: new Date().toISOString(),
      scope:
        'Current KR App Store release notes and descriptions only; not all historical releases, developer websites, badge observations or device tests. No database writes or automatic support decisions.',
      observations: [],
    };
    await mkdir(dirname(path), { recursive: true });
    await save(path, manifest);
  }
  const pending = ids.filter(
    (id) => !manifest.observations.some((row) => row.appStoreId === id && row.metadata),
  );
  for (let offset = 0; offset < pending.length; offset += 20) {
    const batch = pending.slice(offset, offset + 20);
    let captured: Response | undefined;
    let observations: Observation[];
    try {
      observations = await lookupAppleBatch(batch, {
        fetcher: async (url, init) => {
          // The shared lookup validates the response size and app/country identities before parsing this clone.
          await captured?.body?.cancel().catch(() => {});
          const response = await fetch(url, init);
          captured = response.ok ? response.clone() : undefined;
          return response;
        },
      });
      const body = (await captured!.json()) as { results: Record<string, unknown>[] };
      for (const row of observations) {
        if (!row.metadata) continue;
        const raw = body.results.find((item) => String(item.trackId) === row.appStoreId)!;
        row.description = typeof raw.description === 'string' ? raw.description : null;
        row.developerUrl = typeof raw.sellerUrl === 'string' ? raw.sellerUrl : null;
        row.versionReleasedAt =
          typeof raw.currentVersionReleaseDate === 'string' ? raw.currentVersionReleaseDate : null;
        const text = `${row.metadata.release_notes ?? ''}\n${row.description ?? ''}`;
        row.keywords = [
          [/\bduo\b|듀오|双屏|雙屏/iu, 'duo'],
          [/fold(?:able|ing|ed)?|폴더블|접히|접힘|펼친|펼침|折叠|折疊/iu, 'foldable'],
          [
            /split[ -]?view|멀티태스킹|large[ -]?screen|wide[ -]?screen|adaptive[ -]?layout/iu,
            'layout',
          ],
        ]
          .filter(([pattern]) => (pattern as RegExp).test(text))
          .map(([, name]) => name as string);
      }
    } catch (error) {
      await captured?.body?.cancel().catch(() => {});
      observations = batch.map((appStoreId) => ({
        appStoreId,
        error: error instanceof ImportError ? error.code : 'collectionFailed',
      }));
    }
    for (const row of observations) {
      const index = manifest.observations.findIndex((old) => old.appStoreId === row.appStoreId);
      if (index < 0) manifest.observations.push(row);
      else manifest.observations[index] = row;
    }
    delete manifest.completedAt;
    await save(path, manifest);
    console.log(
      `Lookup ${manifest.observations.filter((row) => row.metadata).length}/${ids.length}; errors ${manifest.observations.filter((row) => !row.metadata).length}`,
    );
  }
  if (
    manifest.observations.length === ids.length &&
    manifest.observations.every((row) => row.metadata)
  ) {
    manifest.completedAt ??= new Date().toISOString();
    await save(path, manifest);
  }
  console.log(
    JSON.stringify({
      total: ids.length,
      success: manifest.observations.filter((row) => row.metadata).length,
      errors: manifest.observations.filter((row) => !row.metadata).length,
      candidates: manifest.observations.filter((row) => row.keywords?.length).length,
      source: path,
    }),
  );
  if (manifest.observations.some((row) => !row.metadata)) process.exitCode = 1;
} catch (error) {
  console.error(
    error instanceof ImportError
      ? error.code
      : error instanceof Error
        ? error.message
        : 'Rescan failed.',
  );
  process.exitCode = 1;
}
