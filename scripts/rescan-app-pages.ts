// Public App Store pages only. Excludes recommended apps and customer reviews from evidence.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

type Version = { version: string | null; releasedAt: string | null; text: string };
type Page = {
  appStoreId: string;
  url: string;
  observedAt: string;
  status?: number;
  htmlHash?: string;
  name?: string;
  description?: string | null;
  versions?: Version[];
  badges?: unknown[];
  matchingText?: { path: string; text: string }[];
  error?: string;
};
type Manifest = {
  version: 1;
  baselineHash: string;
  startedAt: string;
  completedAt?: string;
  scope: string;
  pages: Page[];
};
type JsonObject = { [key: string]: unknown };
const object = (value: unknown): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {};
const objects = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.map(object) : []);
const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const keyword =
  /\bduo\b|듀오|fold(?:able|ing|ed)?|폴더블|접힘|접히|펼친|펼침|折叠|折疊|双屏|雙屏/iu;

async function collect(appStoreId: string): Promise<Page> {
  const page: Page = {
    appStoreId,
    url: `https://apps.apple.com/kr/app/id${appStoreId}`,
    observedAt: new Date().toISOString(),
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(page.url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
        headers: { Accept: 'text/html' },
      });
      page.status = response.status;
      page.observedAt = new Date().toISOString();
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status === 429 || response.status >= 500) {
          const seconds = Number(response.headers.get('retry-after'));
          await delay(
            Math.min(60000, Math.max(5000, Number.isFinite(seconds) ? seconds * 1000 : 0)),
          );
        } else throw new Error(`http${response.status}`);
        if (attempt < 2) continue;
        throw new Error(`http${response.status}`);
      }
      const finalUrl = new URL(response.url);
      if (
        finalUrl.hostname !== 'apps.apple.com' ||
        !finalUrl.pathname.startsWith('/kr/') ||
        !finalUrl.pathname.endsWith(`id${appStoreId}`)
      )
        throw new Error('identityMismatch');
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const item = await reader.read();
          if (item.done) break;
          size += item.value.byteLength;
          if (size > 4194304) throw new Error('oversized');
          chunks.push(item.value);
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
      const html = Buffer.concat(chunks).toString('utf8');
      const script = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
      if (!script) throw new Error('pageDataMissing');
      const root = object(JSON.parse(script[1]));
      const product = objects(root.data).find(
        (item) =>
          String(object(item.intent).id) === appStoreId && object(item.intent).storefront === 'kr',
      );
      if (!product) throw new Error('productIdentityMissing');
      const data = object(product.data);
      const shelves = object(data.shelfMapping);
      if (!shelves.topLockup || typeof data.title !== 'string')
        throw new Error('productContentMissing');
      const recent = object(shelves.mostRecentVersion);
      const historyShelves = objects(object(object(recent.seeAllAction).pageData).shelves);
      const versions = historyShelves.flatMap((shelf) => objects(shelf.items));
      if (!versions.length) versions.push(...objects(recent.items));
      page.versions = versions
        .filter((item) => typeof item.text === 'string')
        .map((item) => ({
          version: text(item.primarySubtitle),
          releasedAt: text(item.secondarySubtitle),
          text: item.text as string,
        }));
      page.name = data.title;
      page.description = text(
        object(objects(object(shelves.description).items)[0]?.paragraph).text,
      );
      page.badges = objects(object(shelves.informationRibbon).items).map((item) => ({
        type: item.type,
        heading: item.heading,
        caption: item.caption,
        accessibilityTitle: item.accessibilityTitle,
        accessibilityCaption: item.accessibilityCaption,
      }));
      page.htmlHash = createHash('sha256').update(html).digest('hex');
      page.matchingText = [];
      function walk(value: unknown, path: string) {
        if (typeof value === 'string' && keyword.test(value) && !/^https?:/.test(value))
          page.matchingText!.push({ path, text: value });
        else if (value && typeof value === 'object')
          for (const [key, child] of Object.entries(value)) {
            if (!/action|metrics|artwork|url/i.test(key)) walk(child, `${path}.${key}`);
          }
      }
      for (const key of ['topLockup', 'informationRibbon', 'textCards', 'information'])
        walk(shelves[key], key);
      delete page.error;
      return page;
    } catch (error) {
      page.error =
        error instanceof Error &&
        /^(http\d+|identityMismatch|oversized|pageDataMissing|productIdentityMissing|productContentMissing)$/.test(
          error.message,
        )
          ? error.message
          : 'requestOrParseFailed';
      if (/^http4(?!29)/.test(page.error)) break;
      if (attempt < 2) await delay(2000 * (attempt + 1));
    }
  }
  return page;
}

try {
  const args = process.argv.slice(2);
  if (
    args.length !== 2 ||
    !args.some((arg) => /^--baseline=\.data\/[a-z0-9_./-]+\.json$/.test(arg)) ||
    !args.some((arg) => /^--source=docs\/data\/[a-z0-9-]+\.json$/.test(arg))
  )
    throw new Error('Use --baseline=.data/path.json --source=docs/data/name.json.');
  const baseline = await readFile(
    args.find((arg) => arg.startsWith('--baseline='))!.slice(11),
    'utf8',
  );
  const ids = (JSON.parse(baseline) as { apps: { app_store_id: string }[] }).apps.map(
    (app) => app.app_store_id,
  );
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !/^[1-9][0-9]{0,19}$/.test(id))
  )
    throw new Error('Invalid baseline identities.');
  const baselineHash = createHash('sha256').update(baseline).digest('hex');
  const path = args.find((arg) => arg.startsWith('--source='))!.slice(9);
  let manifest: Manifest;
  try {
    manifest = JSON.parse(await readFile(path, 'utf8')) as Manifest;
    if (
      manifest.version !== 1 ||
      manifest.baselineHash !== baselineHash ||
      !Array.isArray(manifest.pages) ||
      new Set(manifest.pages.map((page) => page.appStoreId)).size !== manifest.pages.length ||
      manifest.pages.some((page) => !ids.includes(page.appStoreId))
    )
      throw new Error('Invalid manifest baseline or identities.');
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'))
      throw error;
    manifest = {
      version: 1,
      baselineHash,
      startedAt: new Date().toISOString(),
      scope:
        'KR product description, primary-product metadata/badges and version history embedded in the public App Store page (up to 25 versions observed). Excludes other apps, customer reviews, developer-site crawl and device testing. No database writes.',
      pages: [],
    };
  }
  await mkdir(dirname(path), { recursive: true });
  async function save() {
    await writeFile(path + '.tmp', JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600 });
    await rename(path + '.tmp', path);
  }
  const pending = ids.filter(
    (id) => !manifest.pages.some((page) => page.appStoreId === id && !page.error),
  );
  for (let offset = 0; offset < pending.length; offset += 2) {
    const pages = await Promise.all(pending.slice(offset, offset + 2).map(collect));
    for (const page of pages) {
      const index = manifest.pages.findIndex((old) => old.appStoreId === page.appStoreId);
      if (index < 0) manifest.pages.push(page);
      else manifest.pages[index] = page;
    }
    delete manifest.completedAt;
    await save();
    if (offset % 20 === 0)
      console.log(
        `Pages ${manifest.pages.length}/${ids.length}; errors ${manifest.pages.filter((page) => page.error).length}`,
      );
    await delay(750);
  }
  if (manifest.pages.length === ids.length && manifest.pages.every((page) => !page.error)) {
    manifest.completedAt ??= new Date().toISOString();
    await save();
  }
  console.log(
    JSON.stringify({
      total: ids.length,
      success: manifest.pages.filter((page) => !page.error).length,
      errors: manifest.pages.filter((page) => page.error).length,
      versions: manifest.pages.reduce((sum, page) => sum + (page.versions?.length ?? 0), 0),
      source: path,
    }),
  );
  if (manifest.pages.some((page) => page.error)) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Page rescan failed.');
  process.exitCode = 1;
}
