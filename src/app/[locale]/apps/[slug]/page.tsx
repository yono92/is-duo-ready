import { Card } from '@/components/ui/surfaces';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, getFormatter } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/components/ui/link';
import { getPublishedApp, getPublicHistory } from '@/lib/data/directory';
import { appContent } from '@/lib/directory/content';
import { parseQuery, queryString, type RawQuery } from '@/lib/directory/query';
import type { Locale } from '@/lib/directory/types';
import { FixtureNotice } from '@/components/fixture-notice';
import { AppIcon } from '@/components/app-icon';
import { StatusBadge } from '@/components/status-badge';
import { HistoryList } from '@/components/directory/history-list';
import { AppStoreBadge } from '@/components/app-store-badge';
import { appMetadata } from '@/lib/data/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getPublishedApp(slug);
  if (!result) notFound();
  if ('redirect' in result) return {};
  return appMetadata(locale, result.app);
}

export default async function AppDetail({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<RawQuery>;
}) {
  const { locale, slug } = await params;
  const result = await getPublishedApp(slug);
  const qs = queryString(parseQuery(await searchParams));
  if (!result) notFound();
  if ('redirect' in result)
    permanentRedirect(`/${locale}/apps/${result.redirect}${qs ? `?${qs}` : ''}`);
  const app = result.app;
  const [t, d, h, format] = await Promise.all([
    getTranslations('Detail'),
    getTranslations('Directory'),
    getTranslations('Home'),
    getFormatter(),
  ]);
  const content = appContent(app, locale);
  const history = !app.fictional && result.id ? await getPublicHistory(1, result.id) : null;
  const date = (value: string) =>
    format.dateTime(new Date(value), { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <main id="main" className="site-width py-10">
      <Link
        href={`/${qs ? `?${qs}` : ''}`}
        className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        {d('back')}
      </Link>
      {app.fictional && <FixtureNotice />}
      <article className="mx-auto mt-12 max-w-3xl">
        <div className="flex items-center gap-4">
          <AppIcon name={app.icon} src={!app.fictional ? app.iconUrl : null} />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{app.names[locale]}</h1>
            <p className="mt-1 text-muted-foreground">{app.developer}</p>
          </div>
        </div>
        <div className="mt-6">
          <StatusBadge status={app.status} fictional={app.fictional} />
        </div>
        {!app.fictional &&
          (app.iconUrl ? (
            <div className="-ml-2.5 mt-4">
              <AppStoreBadge url={app.storeUrl} name={app.names[locale]} />
            </div>
          ) : (
            <Link
              className="mt-6 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
              href={app.storeUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('openStore')}
            </Link>
          ))}
        <Card padding={5}>
          <dl className="my-8 grid gap-6 sm:grid-cols-2">
            {[
              [t('region'), h('region')],
              [
                t('version'),
                !app.fictional
                  ? (app.supportVersion ?? t('versionUndisclosed'))
                  : t('notAvailable'),
              ],
              ...(!app.fictional
                ? [[t('currentVersion'), app.currentVersion ?? t('versionUndisclosed')]]
                : []),
              [t('review'), app.reviewedAt ? date(app.reviewedAt) : t('notReviewed')],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-2 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <h2 className="text-lg font-semibold">{t('summary')}</h2>
        <p
          lang={content.original ? app.originalLocale : locale}
          className="mt-3 whitespace-pre-wrap leading-relaxed text-muted-foreground"
        >
          {content.summary ?? d('noSummary')}
        </p>
        {content.original && <p className="mt-2 text-sm text-muted-foreground">{d('original')}</p>}
        {!app.fictional && app.investigationReason && (
          <section className="mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold">{t('investigation')}</h2>
            <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
              {app.investigationReason}
            </p>
          </section>
        )}
        {!app.fictional && app.features.length > 0 && (
          <section className="mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold">{t('features')}</h2>
            <ul className="mt-4 space-y-3">
              {app.features.map((feature) => (
                <li key={feature.key}>
                  <p>{feature.description}</p>
                  <Link
                    href={`#evidence-${feature.evidenceId}`}
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    {t('featureEvidence')}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="mt-8 border-t pt-8">
          <h2 className="text-lg font-semibold">{t('evidenceTitle')}</h2>
          {app.evidence.length === 0 ? (
            <p className="mt-3 text-muted-foreground">
              {t(app.fictional ? 'evidenceEmpty' : 'realEvidenceEmpty')}
            </p>
          ) : (
            <ul className="mt-5 space-y-5">
              {app.evidence.map((source) => (
                <li key={source.id} id={`evidence-${source.id}`}>
                  <Card padding={5} className=" ">
                    <Link
                      className="font-medium text-primary underline underline-offset-4"
                      href={source.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </Link>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {source.announcedAt ? date(source.announcedAt) : t('dateUndisclosed')}
                    </p>
                    <blockquote className="mt-4 whitespace-pre-wrap border-l-2 pl-4 text-sm leading-relaxed">
                      {source.quote}
                    </blockquote>
                    <p className="mt-3 text-xs text-muted-foreground">{t('originalQuote')}</p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
        {history && (
          <section className="mt-8 border-t pt-8">
            <h2 className="mb-5 text-lg font-semibold">{t('history')}</h2>
            <HistoryList items={history.items} locale={locale} />
            {history.pages > 1 && (
              <Link className="text-primary" href="/updates">
                {t('moreHistory')}
              </Link>
            )}
          </section>
        )}
        {!app.fictional && (
          <Link
            className="mt-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            href={`/submit?app=${encodeURIComponent(app.slug)}`}
          >
            {t('suggestCorrection')}
          </Link>
        )}
      </article>
    </main>
  );
}
