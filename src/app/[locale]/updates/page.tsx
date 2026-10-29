import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { dataSource, getPublicHistory } from '@/lib/data/directory';
import { HistoryList } from '@/components/directory/history-list';
import { Link } from '@/i18n/navigation';
import { parseQuery } from '@/lib/directory/query';
import type { Locale } from '@/lib/directory/types';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Nav' });
  return {
    title: `${t('updates')} · Is Duo Ready?`,
    alternates: {
      canonical: `/${locale}/updates`,
      languages: { ko: '/ko/updates', en: '/en/updates' },
    },
  };
}
export default async function Updates({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Updates');
  const d = await getTranslations('Directory');
  const query = parseQuery(await searchParams);
  const history = await getPublicHistory(query.page);
  if (history.page !== query.page) redirect(`/${locale}/updates?page=${history.page}`);
  const real = dataSource() === 'postgres';
  return (
    <main id="main" className="site-width py-12">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="mb-8 mt-4 text-muted-foreground">{t('description')}</p>
        {history.items.length ? (
          <HistoryList items={history.items} locale={locale} showNames />
        ) : (
          <p className="rounded-xl border bg-card p-5">{t(real ? 'empty' : 'unavailable')}</p>
        )}
        {history.pages > 1 && (
          <nav
            aria-label={t('pagination')}
            className="mt-6 flex items-center justify-between gap-4"
          >
            {history.page > 1 ? (
              <Link className="text-primary" href={`/updates?page=${history.page - 1}`}>
                {d('previous')}
              </Link>
            ) : (
              <span />
            )}
            <p className="text-sm">{d('page', { page: history.page, pages: history.pages })}</p>
            {history.page < history.pages ? (
              <Link className="text-primary" href={`/updates?page=${history.page + 1}`}>
                {d('next')}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
