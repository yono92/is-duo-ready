import { getTranslations } from 'next-intl/server';
import { Link } from '@/components/ui/link';
import { researchForApp } from '@/lib/directory/research';
import type { Locale } from '@/lib/directory/types';

export async function ResearchHistory({
  storeUrl,
  slug,
  locale,
}: {
  storeUrl: string;
  slug: string;
  locale: Locale;
}) {
  const t = await getTranslations('Research');
  const research = researchForApp(storeUrl);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Seoul',
    }).format(new Date(value));
  return (
    <section className="mt-8 border-t pt-8" aria-labelledby="research-title">
      <h2 id="research-title" className="text-lg font-semibold">
        {t('title')}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t(research ? 'intro' : 'empty')}
      </p>
      {research && (
        <>
          <ul className="mt-5 space-y-5">
            {research.checks.map((check, index) => (
              <li key={`${check.url}-${index}`} className="space-y-2 border-l-2 pl-4 text-sm">
                <Link
                  href={check.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline underline-offset-4"
                >
                  {t(`sourceKinds.${check.kind}`)}
                </Link>
                <p>{t(`outcomes.${check.outcome}`)}</p>
                <p className="leading-relaxed text-muted-foreground">{check.note[locale]}</p>
                {check.quote && (
                  <blockquote className="break-words whitespace-pre-wrap">{check.quote}</blockquote>
                )}
                <p className="text-xs text-muted-foreground">
                  <time dateTime={check.checkedAt}>
                    {t('checkedAt', { date: date(check.checkedAt) })}
                  </time>
                </p>
              </li>
            ))}
            {(['app_store', 'developer', 'badge'] as const)
              .filter((kind) => !research.checks.some((check) => check.kind === kind))
              .map((kind) => (
                <li key={kind} className="text-sm text-muted-foreground">
                  {t(`sourceKinds.${kind}`)} · {t('notChecked')}
                </li>
              ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('scope')}</p>
        </>
      )}
      <Link
        className="mt-4 inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
        href={`/submit?app=${encodeURIComponent(slug)}`}
      >
        {t('contribute')}
      </Link>
    </section>
  );
}
