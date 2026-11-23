import { getTranslations } from 'next-intl/server';
import { getSupportedInCategory } from '@/lib/data/directory';
import type { Category, Locale } from '@/lib/directory/types';
import { AppCard } from './app-card';

export async function Alternatives({
  category,
  slug,
  locale,
}: {
  category: Category;
  slug: string;
  locale: Locale;
}) {
  const apps = await getSupportedInCategory(category, slug, locale);
  if (!apps.length) return null;
  const [t, c] = await Promise.all([
    getTranslations('Alternatives'),
    getTranslations('Categories'),
  ]);
  return (
    <section
      className="mt-8 border-t pt-8"
      aria-labelledby="alternatives-title"
      data-testid="alternatives"
    >
      <h2 id="alternatives-title" className="text-lg font-semibold">
        {t('title')}
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">{t('intro', { category: c(category) })}</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <li key={app.slug}>
            <AppCard app={app} locale={locale} query="" />
          </li>
        ))}
      </ul>
    </section>
  );
}
