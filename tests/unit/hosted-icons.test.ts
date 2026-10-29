import { expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { supabaseIconStorage } from '../../src/lib/icons/hosted.mjs';

const env = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://testproject.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_STORAGE_BUCKET: 'app-icons',
};

test('hosted storage checks private bucket and round-trips exact bytes with bounded requests', async () => {
  const bytes = Buffer.from('test-only payload');
  const path = createHash('sha256').update(bytes).digest('hex') + '.png';
  let uploaded = false;
  const adapter = supabaseIconStorage(env, {
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      expect(url.origin).toBe(env.NEXT_PUBLIC_SUPABASE_URL);
      expect(init?.redirect).toBe('error');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      if (url.pathname.includes('/bucket/'))
        return Response.json({ public: false, file_size_limit: 2097152 });
      if (init?.method === 'POST') {
        uploaded = true;
        return Response.json({ Key: path });
      }
      expect(uploaded).toBe(true);
      return new Response(new Uint8Array(bytes));
    },
  });
  await adapter.put(path, bytes);
  expect(await adapter.read(path)).toEqual(bytes);
  await expect(adapter.read('../private')).rejects.toThrow('invalidIconPath');
  await expect(adapter.put(path, Buffer.from('different'))).rejects.toThrow('corruptIcon');
});

test('public bucket and corrupt remote bytes fail closed', async () => {
  const path = 'a'.repeat(64) + '.png';
  const publicStorage = supabaseIconStorage(env, {
    fetcher: async () => Response.json({ public: true, file_size_limit: 2097152 }),
  });
  await expect(publicStorage.read(path)).rejects.toThrow('private');
  const corrupt = supabaseIconStorage(env, {
    fetcher: async (input) =>
      String(input).includes('/bucket/')
        ? Response.json({ public: false, file_size_limit: 2097152 })
        : new Response('corrupt'),
  });
  await expect(corrupt.read(path)).rejects.toThrow('corruptIcon');
  expect(() =>
    supabaseIconStorage({ ...env, NEXT_PUBLIC_SUPABASE_URL: 'https://evil.test' }),
  ).toThrow();
});
