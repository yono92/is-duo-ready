import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

const maxBytes = 2097152;
function verify(key, bytes) {
  if (!/^[a-f0-9]{64}\.(png|jpg|webp)$/.test(key)) throw new Error('invalidIconPath');
  if (
    bytes &&
    (!bytes.length ||
      bytes.length > maxBytes ||
      createHash('sha256').update(bytes).digest('hex') !== key.split('.')[0])
  )
    throw new Error('corruptIcon');
}

/** Server-only callers. Credentials are never returned to the browser.
 * @param {Record<string,string|undefined>} env
 * @param {{fetcher?: typeof fetch}} options
 */
export function supabaseIconStorage(env = process.env, { fetcher = fetch } = {}) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = env.SUPABASE_SECRET_KEY ?? '';
  const bucket = env.SUPABASE_STORAGE_BUCKET ?? '';
  if (
    !/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) ||
    !key ||
    !/^[a-z0-9][a-z0-9-]{1,62}$/.test(bucket)
  )
    throw new Error('Invalid hosted storage configuration.');
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetcher(input, {
          ...init,
          redirect: 'error',
          signal: AbortSignal.timeout(8000),
        }),
    },
  });
  let checked;
  async function privateBucket() {
    checked ??= (async () => {
      const { data, error } = await client.storage.getBucket(bucket);
      if (
        error ||
        !data ||
        data.public ||
        Number(data.file_size_limit) > maxBytes ||
        !data.file_size_limit
      )
        throw new Error('A private size-limited icon bucket is required.');
    })();
    return checked;
  }
  return {
    async ensureBucket() {
      const { data, error } = await client.storage.getBucket(bucket);
      if (error && (String(error.statusCode) === '404' || error.message === 'Bucket not found')) {
        const created = await client.storage.createBucket(bucket, {
          public: false,
          fileSizeLimit: maxBytes,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        });
        if (created.error) throw new Error('Icon bucket creation failed.');
      } else if (error || !data) throw new Error('Icon bucket inspection failed.');
      await privateBucket();
    },
    async put(path, bytes) {
      verify(path, bytes);
      await privateBucket();
      const type = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[path.split('.')[1]];
      const { error } = await client.storage.from(bucket).upload(path, bytes, {
        contentType: type,
        upsert: true,
        cacheControl: '0',
      });
      if (error) throw new Error('Icon upload failed.');
    },
    async read(path) {
      verify(path);
      await privateBucket();
      const { data, error } = await client.storage.from(bucket).download(path);
      if (error || !data || data.size > maxBytes) throw new Error('Icon download failed.');
      const bytes = Buffer.from(await data.arrayBuffer());
      verify(path, bytes);
      return bytes;
    },
  };
}
