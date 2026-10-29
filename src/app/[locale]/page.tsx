import { Card, EmptyState } from '@/components/ui/surfaces';
import { DevicePreview } from '@/components/device-preview';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Globe2, SearchX } from 'lucide-react';
import { Link } from '@/components/ui/link';
import { redirect } from '@/i18n/navigation';
import { getDirectoryPage } from '@/lib/data/directory';
import { parseQuery, queryString, type RawQuery } from '@/lib/directory/query';
import type { Locale } from '@/lib/directory/types';
import { deviceAsset } from '@/lib/device-asset';
import { FixtureNotice } from '@/components/fixture-notice';
import { DirectoryControls } from '@/components/directory/controls';
import { AppCard } from '@/components/directory/app-card';
import { ButtonLink } from '@/components/ui/button';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: { canonical: `/${locale}`, languages: { ko: '/ko', en: '/en', 'x-default': '/' } },
  };
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
  const n = await getTranslations('Nav');
  const query = parseQuery(await searchParams);
  const data = await getDirectoryPage(query, locale);
  const result = data.kind === 'available' ? data.result : null;
  if (result && result.page !== query.page)
    redirect({ href: `/?${queryString({ ...query, page: result.page })}`, locale });
  return (
    <main id="main">
      <section className="hero-surface">
        <div className="hero site-width">
          <div className="hero-copy">
            <h1 className="hero-title">{t('title')}</h1>
            <p className="hero-description">{t('description')}</p>
            <div className="hero-actions">
              <ButtonLink href="#directory-heading">{t('browse')}</ButtonLink>
              <Link href="/methodology" className="hero-link">
                <span className="inline-flex items-center gap-2">
                  {t('methodology')}
                  <ArrowRight size={16} />
                </span>
              </Link>
            </div>
          </div>
          {deviceAsset && <DevicePreview />}
        </div>
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
            <p className="directory-region">
              <Globe2 size={14} aria-hidden="true" />
              {t('region')}
            </p>
          </div>
          {data.kind === 'available' && result ? (
            <>
              {data.fictional && <FixtureNotice />}
              <div className="mt-5">
                <DirectoryControls
                  query={query}
                  total={result.total}
                  pages={result.pages}
                  fictional={data.fictional}
                >
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
    </main>
  );
}
