import Image from 'next/image';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, SearchX } from 'lucide-react';
import { Link, redirect } from '@/i18n/navigation';
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
            <Link href="/methodology" className="hero-link">
              {t('methodology')}
              <ArrowRight size={16} />
            </Link>
          </div>
          {deviceAsset && (
            <figure className="hero-device">
              <Image
                src={deviceAsset.src}
                alt={t('deviceAlt')}
                width={deviceAsset.width}
                height={deviceAsset.height}
                sizes="(max-width: 767px) 150px, 300px"
                priority
              />
              <figcaption className="device-caption">{t('deviceCaption')}</figcaption>
            </figure>
          )}
        </div>
      </section>
      <section aria-labelledby="directory-heading" className="directory-section">
        <div className="site-width">
          <div className="directory-intro">
            <div>
              <h2 id="directory-heading" className="directory-title">
                {n('explore')}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">{t('region')}</p>
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
                    <div className="empty-panel">
                      <SearchX size={32} className="mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{d('emptyTitle')}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {d(data.fictional ? 'emptyDescription' : 'realEmptyDescription')}
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <ButtonLink variant="outline" href="/">
                          {d('reset')}
                        </ButtonLink>
                        <ButtonLink href="/submit">{n('submit')}</ButtonLink>
                      </div>
                    </div>
                  )}
                </DirectoryControls>
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <h3 className="text-lg font-semibold">{d('unavailableTitle')}</h3>
              <p className="mt-3 text-muted-foreground">{d('unavailableDescription')}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
