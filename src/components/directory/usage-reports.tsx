import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/components/ui/link';
import { Card } from '@/components/ui/surfaces';
import { getUsageReports } from '@/lib/operations/usage';
import type { Locale } from '@/lib/directory/types';
import { UsageDetails } from './usage-details';

export async function UsageReports({
  appId,
  slug,
  locale,
}: {
  appId: string;
  slug: string;
  locale: Locale;
}) {
  const t = await getTranslations('Usage');
  const reports = await getUsageReports(appId).catch(() => null);
  return (
    <section className="mt-8 border-t pt-8" aria-labelledby="usage-title">
      <h2 id="usage-title" className="text-lg font-semibold">
        {t('title')}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('intro')}</p>
      {!reports || !reports.length ? (
        <p className="mt-4 text-sm text-muted-foreground">{t(reports ? 'empty' : 'unavailable')}</p>
      ) : (
        <ul className="mt-5 space-y-5">
          {reports.map((report) => (
            <li key={report.id}>
              <Card padding={5} className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground">{t('reviewed')}</p>
                <UsageDetails usage={report.usage} />
                <p
                  lang={report.locale}
                  className="break-words whitespace-pre-wrap text-sm leading-relaxed"
                >
                  {report.body}
                </p>
                {report.locale !== locale && (
                  <p className="text-xs text-muted-foreground">{t('originalLanguage')}</p>
                )}
                {report.evidenceUrl && (
                  <Link
                    className="text-sm text-primary underline underline-offset-4"
                    href={report.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('evidenceLink')}
                  </Link>
                )}
                {report.hasScreenshot && (
                  <Link
                    href={`/api/usage-screenshots/${report.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Image
                      src={`/api/usage-screenshots/${report.id}`}
                      alt={t('screenshotAlt')}
                      width={800}
                      height={800}
                      unoptimized
                      className="h-auto max-h-96 w-auto max-w-full rounded-lg border object-contain"
                    />
                    <span className="mt-2 inline-block text-sm text-primary underline underline-offset-4">
                      {t('openScreenshot')}
                    </span>
                  </Link>
                )}
                <p className="text-xs text-muted-foreground">
                  <time dateTime={report.publishedAt}>
                    {t('publishedDate', {
                      date: new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeZone: 'Asia/Seoul',
                      }).format(new Date(report.publishedAt)),
                    })}
                  </time>
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Link
        className="mt-4 inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
        href={`/submit?app=${encodeURIComponent(slug)}&kind=usage`}
      >
        {t('submit')}
      </Link>
    </section>
  );
}
