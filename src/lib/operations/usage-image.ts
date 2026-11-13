import sharp from 'sharp';

export class UsageImageError extends Error {}
export async function normalizeUsageScreenshot(value: FormDataEntryValue | null) {
  if (value === null || (value instanceof File && value.size === 0)) return null;
  if (
    !(value instanceof File) ||
    value.size > 2 * 1024 * 1024 ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(value.type)
  )
    throw new UsageImageError('invalidScreenshot');
  try {
    const source = Buffer.from(await value.arrayBuffer());
    const input = sharp(source, { limitInputPixels: 16_000_000, animated: false });
    const metadata = await input.metadata();
    if (!['png', 'jpeg', 'webp'].includes(metadata.format ?? '') || (metadata.pages ?? 1) > 1)
      throw new UsageImageError('invalidScreenshot');
    const output = await input
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    if (output.length > 1024 * 1024) throw new UsageImageError('invalidScreenshot');
    return output.toString('base64');
  } catch {
    throw new UsageImageError('invalidScreenshot');
  }
}
