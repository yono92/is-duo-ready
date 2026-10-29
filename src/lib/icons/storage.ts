import type { DatabaseClient, Environment } from '../db/types.ts';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import sharp from 'sharp';
import { supabaseIconStorage } from './hosted.ts';

const MAX_BYTES = 2 * 1024 * 1024;
const formats: Partial<Record<string, readonly [string, string]>> = {
  jpeg: ['jpg', 'image/jpeg'],
  png: ['png', 'image/png'],
  webp: ['webp', 'image/webp'],
};

export function iconSource(value: unknown) {
  if (typeof value !== 'string' || value.length > 2000) throw new Error('invalidIconSource');
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.hash ||
    !/^is\d+(?:-ssl)?\.mzstatic\.com$/.test(url.hostname) ||
    !url.pathname.startsWith('/image/')
  )
    throw new Error('invalidIconSource');
  return url.href;
}

// The persistence boundary: collection and rendering do not depend on an external URL.
// Hosted storage implements the same put/read operations.
export function localIconStorage(env: Environment = process.env) {
  if (env.VERCEL !== undefined) throw new Error('Persistent icon storage is not configured.');
  const root = resolve(env.APP_ICON_STORAGE_DIR || join(process.cwd(), '.data/app-icons'));
  const pathFor = (key: string) => {
    if (!/^[a-f0-9]{64}\.(png|jpg|webp)$/.test(key)) throw new Error('invalidIconPath');
    return join(root, key);
  };
  return {
    async put(key: string, bytes: Buffer) {
      const target = pathFor(key);
      await mkdir(root, { recursive: true, mode: 0o700 });
      const temporary = `${target}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, bytes, { flag: 'wx', mode: 0o600 });
        await rename(temporary, target);
      } finally {
        await unlink(temporary).catch(() => {});
      }
    },
    async read(key: string) {
      const path = pathFor(key);
      if ((await stat(path)).size > MAX_BYTES) throw new Error('oversizedIcon');
      const bytes = await readFile(path);
      if (createHash('sha256').update(bytes).digest('hex') !== key.split('.')[0])
        throw new Error('corruptIcon');
      return bytes;
    },
  };
}

export function iconStorage(env: Environment = process.env) {
  if (env.ICON_STORAGE_PROVIDER === 'supabase') return supabaseIconStorage(env);
  if (env.ICON_STORAGE_PROVIDER && env.ICON_STORAGE_PROVIDER !== 'local')
    throw new Error('Invalid icon storage provider.');
  return localIconStorage(env);
}

export async function inspectIcon(bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('oversizedIcon');
  const decoded = sharp(bytes, { limitInputPixels: 2048 * 2048, animated: false });
  const metadata = await decoded.metadata();
  const format = formats[metadata.format ?? ''];
  if (
    !format ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > 2048 ||
    metadata.height > 2048 ||
    (metadata.pages ?? 1) > 1
  )
    throw new Error('invalidIconFormat');
  // Decode fully before storing, but retain the original bytes and appearance.
  await decoded.raw().toBuffer();
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  return {
    storage_path: `${sha256}.${format[0]}`,
    sha256,
    content_type: format[1],
    byte_size: bytes.length,
    width: metadata.width,
    height: metadata.height,
  };
}

export async function downloadIcon(
  source: string,
  { fetcher = fetch, timeoutMs = 8000 }: { fetcher?: typeof fetch; timeoutMs?: number } = {},
) {
  const url = iconSource(source);
  const response = await fetcher(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'image/png,image/jpeg,image/webp' },
    cache: 'no-store',
  });
  if (
    !response.ok ||
    !response.body ||
    Number(response.headers.get('content-length')) > MAX_BYTES
  ) {
    await response.body?.cancel();
    throw new Error('iconDownloadFailed');
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('oversizedIcon');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = Buffer.concat(chunks);
  return { bytes, metadata: await inspectIcon(bytes) };
}

/** Call within an authorized administrator transaction. Failure leaves the previous pointer intact.
 */
export async function collectIcon(
  db: DatabaseClient,
  appId: string,
  source: string | null,
  options: { storage?: ReturnType<typeof localIconStorage>; fetcher?: typeof fetch } = {},
) {
  if (!source) return 'missing';
  await db.query('SAVEPOINT icon_collection');
  try {
    const storage = options.storage ?? iconStorage();
    const startedAt = new Date().toISOString();
    const { bytes, metadata } = await downloadIcon(source, options);
    await storage.put(metadata.storage_path, bytes);
    const result = await db.query(
      `INSERT INTO public.app_icon_assets
      (app_id,storage_path,sha256,content_type,byte_size,width,height,source_url,fetched_at)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9
      WHERE EXISTS(SELECT 1 FROM app_private.app_store_listings WHERE app_id=$1 AND country='KR' AND icon_url=$8)
      ON CONFLICT(app_id) DO UPDATE SET storage_path=excluded.storage_path,sha256=excluded.sha256,
      content_type=excluded.content_type,byte_size=excluded.byte_size,width=excluded.width,height=excluded.height,
      source_url=excluded.source_url,fetched_at=excluded.fetched_at
      WHERE app_icon_assets.fetched_at <= excluded.fetched_at`,
      [
        appId,
        metadata.storage_path,
        metadata.sha256,
        metadata.content_type,
        metadata.byte_size,
        metadata.width,
        metadata.height,
        source,
        startedAt,
      ],
    );
    await db.query('RELEASE SAVEPOINT icon_collection');
    return result.rowCount ? 'stored' : 'superseded';
  } catch {
    await db.query('ROLLBACK TO SAVEPOINT icon_collection');
    await db.query('RELEASE SAVEPOINT icon_collection');
    return 'failed';
  }
}
