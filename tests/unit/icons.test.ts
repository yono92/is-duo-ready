import { expect, test } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { downloadIcon, iconSource, inspectIcon, localIconStorage } from '@/lib/icons/storage.mjs';

const source = 'https://is1-ssl.mzstatic.com/image/thumb/test/icon.png';
const sample = () =>
  sharp({ create: { width: 48, height: 48, channels: 4, background: '#123456' } })
    .png()
    .toBuffer();

test('icon collection accepts only Apple CDN HTTPS URLs and rejects active/oversized images', async () => {
  expect(iconSource(source)).toBe(source);
  for (const url of [
    'http://is1-ssl.mzstatic.com/image/a',
    'https://127.0.0.1/image/a',
    'https://is1-ssl.mzstatic.com.evil.com/image/a',
    'https://user@is1-ssl.mzstatic.com/image/a',
    'https://is1-ssl.mzstatic.com:444/image/a',
    'https://is1-ssl.mzstatic.com/not-an-image',
  ])
    expect(() => iconSource(url)).toThrow();
  await expect(
    inspectIcon(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')),
  ).rejects.toThrow();
  await expect(inspectIcon(Buffer.alloc(2097153))).rejects.toThrow();
  await expect(inspectIcon(Buffer.from('not an image'))).rejects.toThrow();
  await expect(
    downloadIcon(source, { fetcher: async () => new Response('bad', { status: 500 }) }),
  ).rejects.toThrow();
  await expect(
    downloadIcon(source, {
      fetcher: async () => new Response('bad', { headers: { 'content-length': '2097153' } }),
    }),
  ).rejects.toThrow();
  const png = await sample();
  const downloaded = await downloadIcon(source, {
    fetcher: async (_url, init) => {
      expect(init?.redirect).toBe('error');
      return new Response(new Uint8Array(png));
    },
  });
  expect(downloaded.metadata.content_type).toBe('image/png');
  expect(downloaded.bytes.equals(png)).toBe(true);
});

test('stored files survive source unavailability; reject traversal, corruption and ephemeral hosting', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'duo-icons-'));
  try {
    const storage = localIconStorage({ APP_ICON_STORAGE_DIR: dir });
    const bytes = await sample();
    const metadata = await inspectIcon(bytes);
    await storage.put(metadata.storage_path, bytes);
    expect(await storage.read(metadata.storage_path)).toEqual(bytes);
    await expect(storage.read('../secrets')).rejects.toThrow();
    await writeFile(join(dir, metadata.storage_path), 'corrupted');
    await expect(storage.read(metadata.storage_path)).rejects.toThrow('corruptIcon');
    expect(() => localIconStorage({ VERCEL: '1' })).toThrow();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
