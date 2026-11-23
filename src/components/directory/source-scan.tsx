import { getTranslations } from 'next-intl/server';
import { scanForApp } from '@/lib/directory/source-scans';
import type { Locale } from '@/lib/directory/types';

// Latest automated-plus-reviewed check of official KR sources. Display only.
export async function SourceScan({ storeUrl, locale }: { storeUrl: string; locale: Locale }) {
  const scan = scanForApp(storeUrl);
  if (!scan) return null;
  const t = await getTranslations('SourceScan');
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
  }).format(new Date(scan.checkedAt));
  return (
    <section
      className="mt-8 border-t pt-8"
      aria-labelledby="source-scan-title"
      data-testid="source-scan"
    >
      <h2 id="source-scan-title" className="text-lg font-semibold">
        {t('title')}
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        <time dateTime={scan.checkedAt}>
          {scan.versions
            ? t('checked', { date, count: scan.versions })
            : t('checkedNoVersions', { date })}
        </time>
      </p>
      <p className="mt-3 leading-relaxed">{t(`outcomes.${scan.outcome}`)}</p>
      {scan.excerpt && (
        <figure className="mt-4">
          <blockquote className="whitespace-pre-wrap break-words border-l-2 pl-4 text-sm leading-relaxed">
            {scan.excerpt}
          </blockquote>
          <figcaption className="mt-2 text-xs text-muted-foreground">
            {t('excerpt')}
            {scan.excerptVersion
              ? ` · ${t('excerptVersion', { version: scan.excerptVersion })}`
              : ''}
          </figcaption>
        </figure>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {t('note')}
        {scan.outcome.startsWith('evidence') || scan.outcome === 'alternative_observed'
          ? ''
          : ` ${t('noteUnconfirmed')}`}
      </p>
    </section>
  );
}
