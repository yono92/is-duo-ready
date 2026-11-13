import { expect, it } from 'vitest';
import sharp from 'sharp';
import { normalizeUsageScreenshot } from '../../src/lib/operations/usage-image';

it('decodes a screenshot, strips metadata and limits its rendered size', async () => {
  const input = await sharp({
    create: { width: 1800, height: 2000, channels: 3, background: '#cccccc' },
  })
    .withMetadata({ orientation: 6 })
    .png()
    .toBuffer();
  const encoded = await normalizeUsageScreenshot(
    new File([new Uint8Array(input)], 'screen.png', { type: 'image/png' }),
  );
  const metadata = await sharp(Buffer.from(encoded!, 'base64')).metadata();
  expect(metadata.format).toBe('webp');
  expect(Math.max(metadata.width!, metadata.height!)).toBeLessThanOrEqual(1600);
  expect(metadata.exif).toBeUndefined();
  expect(metadata.orientation).toBeUndefined();
});

it('rejects misleading, oversized and non-raster uploads before storage', async () => {
  for (const input of [
    'https://example.com/image.png',
    new File(['<svg/>'], 'screen.svg', { type: 'image/svg+xml' }),
    new File(['not a png'], 'screen.png', { type: 'image/png' }),
    new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'screen.webp', { type: 'image/webp' }),
  ])
    await expect(normalizeUsageScreenshot(input)).rejects.toThrow();
  expect(await normalizeUsageScreenshot(null)).toBeNull();
});
