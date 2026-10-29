import type { MetadataRoute } from 'next';
import { indexingAllowed, languageAlternates, siteOrigin } from '@/lib/data/seo';
import { database } from '@/lib/db/server';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexingAllowed(process.env)) return [];
  const apps = await database(
    null,
    async (db) =>
      (
        await db.query<{ slug: string; reviewed_at: Date }>(
          "SELECT slug,reviewed_at FROM public.directory_entries WHERE publication='published' ORDER BY slug",
        )
      ).rows,
  );
  const origin = siteOrigin();
  return ['ko', 'en'].flatMap((locale) => [
    ...['', '/updates', '/methodology'].map((path) => ({
      url: new URL(`/${locale}${path}`, origin).toString(),
      alternates: { languages: languageAlternates(path) },
    })),
    ...apps.map((app) => ({
      url: new URL(`/${locale}/apps/${encodeURIComponent(app.slug)}`, origin).toString(),
      lastModified: app.reviewed_at,
      alternates: {
        languages: languageAlternates(`/apps/${encodeURIComponent(app.slug)}`),
      },
    })),
  ]);
}
