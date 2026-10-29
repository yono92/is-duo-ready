import { getFormatter, getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { ClickableCard } from '@/components/ui/surfaces';
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
    <ClickableCard
      padding={5}
      className="app-card"
      label={app.names[locale]}
      href={`/apps/${app.slug}${query ? `?${query}` : ''}`}

      data-testid="app-card"
    >
      <div className="app-card-heading">
        <AppIcon name={app.icon} src={!app.fictional ? app.iconUrl : null} />
        <div className="min-w-0 flex-1">
          <h3 className="app-card-title">{app.names[locale]}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{app.developer}</p>
        </div>
        <ArrowUpRight size={16} className="app-card-arrow" aria-hidden="true" />
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
        <span className="app-card-category">{c(app.category)}</span>
        <StatusBadge status={app.status} fictional={app.fictional} />
      </div>
      <p className="app-card-review">
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

      {!app.fictional && app.iconUrl && (
        <div className="-ml-2.5 mt-2">
          <AppStoreBadge url={app.storeUrl} name={app.names[locale]} />
        </div>
      )}
    </ClickableCard>
  );
}
