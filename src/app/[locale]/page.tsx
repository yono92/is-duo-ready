import { Card, Collapsible, EmptyState } from '@/components/ui/surfaces';
import { DevicePreview } from '@/components/device-preview';
import type { Metadata } from 'next';
import { AutoAds } from '@/components/auto-ads';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Globe2, SearchX } from 'lucide-react';
import { Link } from '@/components/ui/link';
import { redirect } from '@/i18n/navigation';
import { getDirectoryPage, getPublicHistory } from '@/lib/data/directory';
import { defaultQuery, parseQuery, queryString, type RawQuery } from '@/lib/directory/query';
import type { Locale } from '@/lib/directory/types';
import { FixtureNotice } from '@/components/fixture-notice';
import { DirectoryControls } from '@/components/directory/controls';
import { DirectorySearch } from '@/components/directory/search';
import { DirectoryNavigation } from '@/components/directory/navigation';
import { AppMarquee } from '@/components/app-marquee';
import { HomeInsights } from '@/components/home-insights';
import { DirectoryOverview } from '@/components/directory/stats';
import { AppCard } from '@/components/directory/app-card';
import { ButtonLink } from '@/components/ui/button';
import { pageMetadata, websiteStructuredData } from '@/lib/data/seo';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, 'home');
}
export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<RawQuery>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');
  const d = await getTranslations('Directory');
  const stats = await getTranslations('DirectoryStats');
  const n = await getTranslations('Nav');
  const assets = await getTranslations('AppAssets');
  const format = await getFormatter();
  const query = parseQuery(await searchParams);
  const dataPromise = getDirectoryPage(query, locale);
  const [data, featured, history] = await Promise.all([
    dataPromise,
    queryString(query) ? getDirectoryPage(defaultQuery, locale) : dataPromise,
    getPublicHistory().catch(() => {
      console.error('Unable to load homepage change history.');
      return null;
    }),
  ]);
  const result = data.kind === 'available' ? data.result : null;
  if (result && result.page !== query.page)
    redirect({ href: `/?${queryString({ ...query, page: result.page })}`, locale });
  return (
    <main id="main">
      <AutoAds
        hasRealContent={data.kind === 'available' && !data.fictional && !!result?.apps.length}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteStructuredData(locale) }}
      />
      <DirectoryNavigation query={query}>
        <section className="hero-surface">
          <div className="hero site-width">
            <div className="hero-copy">
              <h1 className="hero-title">{t('title')}</h1>
              <p className="hero-description">{t('description')}</p>
            </div>
            <DevicePreview />
          </div>
          <div className="hero-search site-width">
            <DirectorySearch query={query} />
            <div className="hero-search-meta">
              <p className="directory-region">
                <Globe2 size={14} aria-hidden="true" />
                {t('region')}
              </p>
              <Link href="/methodology" className="hero-link">
                <span className="inline-flex items-center gap-2">
                  {t('methodology')}
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </div>
          </div>
          {featured.kind === 'available' && (
            <div className="site-width hero-apps">
              {featured.fictional && <FixtureNotice />}
              <AppMarquee
                icons={featured.result.apps
                  .filter((app) => app.publication === 'published')
                  .map((app) => ({
                    slug: app.slug,
                    icon: app.icon,
                    iconUrl: app.fictional ? null : app.iconUrl,
                    name: app.names[locale],
                    storeLinkLabel: assets('storeLink', { name: app.names[locale] }),
                    storeUrl: app.fictional ? undefined : app.storeUrl,
                  }))}
                pauseLabel={t('pauseApps')}
                resumeLabel={t('resumeApps')}
              />
            </div>
          )}
        </section>
        <section aria-labelledby="directory-heading" className="directory-section">
          <div className="site-width">
            <div className="directory-intro">
              <div>
                <h2 id="directory-heading" className="directory-title">
                  {n('explore')}
                </h2>
                <p className="directory-description">{t('directoryDescription')}</p>
              </div>
            </div>
            {data.kind === 'available' && result ? (
              <>
                <div className="mt-5">
                  <DirectoryControls
                    query={query}
                    total={result.total}
                    pages={result.pages}
                    fictional={data.fictional}
                  >
                    <div className="mb-5 space-y-3">
                      <Collapsible defaultIsOpen={false} trigger={stats('title')}>
                        <DirectoryOverview stats={result.stats} fictional={data.fictional} />
                      </Collapsible>
                      {(query.sort === 'familiar' ||
                        query.sort === 'top-free' ||
                        query.sort === 'top-paid') && (
                        <p
                          className="text-xs leading-relaxed text-muted-foreground"
                          data-testid="ranking-note"
                        >
                          {result.ranking ? (
                            <>
                              <Link
                                href={result.ranking.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-4"
                              >
                                {d('rankingAsOf', {
                                  kind: query.sort === 'top-paid' ? 'paid' : 'free',
                                  date: format.dateTime(new Date(result.ranking.observedAt), {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  }),
                                })}
                              </Link>
                              {' · '}
                              {d(
                                query.sort === 'familiar' ? 'familiarDescription' : 'unrankedLast',
                              )}
                            </>
                          ) : (
                            d(
                              query.sort === 'familiar'
                                ? 'familiarUnavailable'
                                : 'rankingUnavailable',
                            )
                          )}
                        </p>
                      )}
                    </div>
                    {result.apps.length ? (
                      <div className="app-grid">
                        {result.apps.map((app) => (
                          <AppCard
                            key={app.slug}
                            app={app}
                            locale={locale}
                            query={queryString(query)}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card padding={5}>
                        <EmptyState
                          title={d('emptyTitle')}
                          description={d(
                            data.fictional ? 'emptyDescription' : 'realEmptyDescription',
                          )}
                          headingLevel={3}
                          icon={<SearchX size={32} />}
                          actions={
                            <>
                              <ButtonLink variant="outline" href="/">
                                {d('reset')}
                              </ButtonLink>
                              <ButtonLink href="/submit">{n('submit')}</ButtonLink>
                            </>
                          }
                        />
                      </Card>
                    )}
                  </DirectoryControls>
                </div>
              </>
            ) : (
              <Card padding={5}>
                <EmptyState
                  title={d('unavailableTitle')}
                  description={d('unavailableDescription')}
                  headingLevel={3}
                />
              </Card>
            )}
          </div>
        </section>
        <div className="site-width home-insights">
          <HomeInsights items={history?.items ?? []} locale={locale} />
        </div>
      </DirectoryNavigation>
    </main>
  );
}
