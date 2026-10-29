import { Card } from '@/components/ui/surfaces';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { dataSource, getPublicHistory } from '@/lib/data/directory';
import { HistoryList } from '@/components/directory/history-list';
import { RoutePagination } from '@/components/ui/route-pagination';
import { parseQuery } from '@/lib/directory/query';
import type { Locale } from '@/lib/directory/types';
import { pageMetadata } from '@/lib/data/seo';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, 'updates');
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
          <Card padding={5}>
            <p className=" ">{t(real ? 'empty' : 'unavailable')}</p>
          </Card>
        )}
        {history.pages > 1 && (
          <RoutePagination
            path="/updates"
            page={history.page}
            pages={history.pages}
            label={t('pagination')}
          />
        )}
      </section>
    </main>
  );
}
