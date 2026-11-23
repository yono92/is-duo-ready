import type { Metadata } from 'next';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ClickableCard } from '@/components/ui/surfaces';
import { supportReports } from '@/lib/directory/reports';
import type { Locale } from '@/lib/directory/types';
import { pageMetadata } from '@/lib/data/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, 'reports');
}

export default async function Reports({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const [t, format] = await Promise.all([getTranslations('Reports'), getFormatter()]);
  return (
    <main id="main" className="site-width py-12">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="mb-8 mt-4 leading-relaxed text-muted-foreground">{t('description')}</p>
        <ul className="space-y-4">
          {supportReports.map((report) => (
            <li key={report.date}>
              <ClickableCard
                padding={5}
                href={`/reports/${report.date}`}
                label={report.title[locale]}
                data-testid="report-card"
              >
                <time dateTime={report.date} className="text-sm text-muted-foreground">
                  {format.dateTime(new Date(`${report.date}T00:00:00+09:00`), {
                    dateStyle: 'long',
                    timeZone: 'Asia/Seoul',
                  })}
                </time>
                <h2 className="mt-2 text-lg font-semibold">{report.title[locale]}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {report.summary[locale]}
                </p>
                <span className="mt-3 inline-block text-sm text-primary">{t('read')}</span>
              </ClickableCard>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
