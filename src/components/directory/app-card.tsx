import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { DirectoryApp, Locale } from '@/lib/directory/types';
import { appContent } from '@/lib/directory/content';
import { AppIcon } from '@/components/app-icon';
import { StatusBadge } from '@/components/status-badge';
import { AppStoreBadge } from '@/components/app-store-badge';
export async function AppCard({
  app,
  locale,
  query,
}: {
  app: DirectoryApp;
  locale: Locale;
  query: string;
}) {
  const t = await getTranslations('Directory');
  const c = await getTranslations('Categories');
  const format = await getFormatter();
  const content = appContent(app, locale);
  return (
    <div className="app-card group">
      <Link
        href={`/apps/${app.slug}${query ? `?${query}` : ''}`}
        className="flex flex-1 flex-col"
        data-testid="app-card"
      >
        <div className="app-card-heading">
          <AppIcon name={app.icon} src={!app.fictional ? app.iconUrl : null} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[19px] font-semibold tracking-tight">{app.names[locale]}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{app.developer}</p>
          </div>
          <ArrowUpRight size={15} className="text-primary" aria-hidden="true" />
        </div>
        <p
          className="app-summary text-muted-foreground"
          lang={content.original ? app.originalLocale : locale}
        >
          {content.summary ?? t('noSummary')}
        </p>
        {content.original && (
          <span className="mt-2 text-xs font-normal text-muted-foreground">{t('original')}</span>
        )}
        <div className="app-card-status">
          <StatusBadge status={app.status} fictional={app.fictional} />
          <span className="text-xs text-muted-foreground">{c(app.category)}</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {app.reviewedAt
            ? t('reviewed', {
                date: format.dateTime(new Date(app.reviewedAt), {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
              })
            : t('noReview')}
        </p>
      </Link>
      {!app.fictional && app.iconUrl && (
        <div className="-ml-2.5 mt-2">
          <AppStoreBadge url={app.storeUrl} name={app.names[locale]} />
        </div>
      )}
    </div>
  );
}
