import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/surfaces';
import { Link } from '@/components/ui/link';
import { AppIcon } from '@/components/app-icon';
import { AutoAds } from '@/components/auto-ads';
import { reportByDate, type ReportApp } from '@/lib/directory/reports';
import type { DirectoryApp, Locale } from '@/lib/directory/types';
import { dataSource, getPublishedAppsBySlugs } from '@/lib/data/directory';
import { reportMetadata } from '@/lib/data/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; date: string }>;
}): Promise<Metadata> {
  const { locale, date } = await params;
  const report = reportByDate(date);
  if (!report) notFound();
  return reportMetadata(locale, report);
}

export default async function Report({
  params,
}: {
  params: Promise<{ locale: Locale; date: string }>;
}) {
  const { locale, date } = await params;
  const report = reportByDate(date);
  if (!report) notFound();
  const [t, format, published] = await Promise.all([
    getTranslations('Reports'),
    getFormatter(),
    getPublishedAppsBySlugs(report.apps.map((app) => app.slug)),
  ]);
  const live = new Map(published.map((app) => [app.slug, app]));
  const apps = new Map(report.apps.map((app) => [app.appStoreId, app]));
  const { totals } = report;
  const stats = [
    [
      'supported',
      t('statValue.supported', { previous: totals.previousSupported, count: totals.supported }),
    ],
    ['added', t('statValue.added', { count: totals.supported - totals.previousSupported })],
    ['published', t('statValue.published', { count: totals.published })],
    [
      'reconfirmed',
      t('statValue.reconfirmed', { count: totals.reconfirmed, total: totals.existingSupported }),
    ],
  ] as const;
  return (
    <main id="main" className="site-width py-10">
      <AutoAds
        hasRealContent={dataSource() === 'postgres'}
        pagePath={`/${locale}/reports/${report.date}`}
      />
      <Link
        href="/reports"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        {t('back')}
      </Link>
      <article className="mx-auto my-12 max-w-3xl">
        <time dateTime={report.date} className="text-sm text-muted-foreground">
          {format.dateTime(new Date(`${report.date}T00:00:00+09:00`), {
            dateStyle: 'long',
            timeZone: 'Asia/Seoul',
          })}
        </time>
        <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {report.title[locale]}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{report.intro[locale]}</p>
        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="report-stats">
          {stats.map(([key, value]) => (
            <div key={key} className="rounded-xl border p-4">
              <dt className="text-xs text-muted-foreground">{t(`stats.${key}`)}</dt>
              <dd className="mt-2 text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <h2 className="mt-12 text-2xl font-semibold">{t('appsTitle')}</h2>
        {report.groups.map((group) => (
          <section key={group.heading.en} className="mt-9">
            <h3 className="text-xl font-semibold">{group.heading[locale]}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{group.body[locale]}</p>
            <ul className="mt-5 space-y-4">
              {group.apps.map((id) => {
                const app = apps.get(id)!;
                return (
                  <li key={id}>
                    <ReportEntry
                      app={app}
                      live={live.get(app.slug)}
                      resolved={dataSource() === 'postgres'}
                      locale={locale}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <section className="mt-12 border-t pt-9">
          <h2 className="text-xl font-semibold">{t('notCountedTitle')}</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted-foreground">
            {report.notCounted.map((item) => (
              <li key={item.en}>{item[locale]}</li>
            ))}
          </ul>
        </section>
        <section className="mt-9">
          <h2 className="text-xl font-semibold">{t('otherChangesTitle')}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t('otherChanges', {
              newApps: totals.newApps,
              versions: totals.versionUpdates,
              renamed: totals.renamed,
              archived: totals.archived,
            })}
          </p>
        </section>
        <p className="mt-9 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
          {t('method')}
        </p>
      </article>
    </main>
  );
}

async function ReportEntry({
  app,
  live,
  resolved,
  locale,
}: {
  app: ReportApp;
  live: DirectoryApp | undefined;
  // Fixture previews cannot resolve real apps; only real data may report a removal.
  resolved: boolean;
  locale: Locale;
}) {
  const t = await getTranslations('Reports');
  const name = live?.names[locale] ?? app.name;
  return (
    <Card padding={5} data-testid="report-app">
      <div className="flex items-center gap-3">
        {live && <AppIcon name={live.icon} src={!live.fictional ? live.iconUrl : null} />}
        <div className="min-w-0">
          <h4 className="font-semibold">
            {live ? (
              <Link href={`/apps/${live.slug}`} className="underline underline-offset-4">
                {name}
              </Link>
            ) : (
              name
            )}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`kinds.${app.kind}`)} ·{' '}
            {app.supportVersion
              ? t('supportVersion', { version: app.supportVersion })
              : t('versionUndisclosed')}
          </p>
        </div>
      </div>
      <p className="mt-4 leading-relaxed">{app.summary[locale]}</p>
      <figure className="mt-4">
        <blockquote className="whitespace-pre-wrap break-words border-l-2 pl-4 text-sm leading-relaxed">
          {app.quote}
        </blockquote>
        <figcaption className="mt-2 text-xs text-muted-foreground">
          <Link
            href={app.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            {t('originalQuote')}
          </Link>
        </figcaption>
      </figure>
      {resolved && !live && <p className="mt-3 text-xs text-muted-foreground">{t('notListed')}</p>}
    </Card>
  );
}
