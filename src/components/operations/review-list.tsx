import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { listReviews } from '@/lib/operations/repository';
import { queueFilter, queuePage, reviewStates } from '@/lib/operations/input';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/lib/directory/types';

export async function ReviewList({
  query,
  submissions = false,
}: {
  query: { state?: string; page?: string };
  submissions?: boolean;
}) {
  const locale = (await getLocale()) as Locale;
  const actor = await requireAdmin(locale);
  const t = await getTranslations('Operations');
  const state = queueFilter(query.state);
  const page = queuePage(query.page);
  const data = await listReviews(actor, state, page, submissions);
  const base = submissions ? '/admin/submissions' : '/admin/reviews';
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{t(submissions ? 'submissions' : 'reviews')}</h1>
        <p className="mt-3 text-muted-foreground">
          {t(submissions ? 'submissionHelp' : 'reviewHelp')}
        </p>
      </header>
      <nav aria-label={t('filterStates')} className="flex flex-wrap gap-3">
        {reviewStates.map((value) => (
          <Link
            key={value}
            href={`${base}?state=${value}`}
            aria-current={state === value ? 'page' : undefined}
            className={`rounded-full border px-4 py-3 text-sm ${state === value ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {t(`states.${value}`)}
          </Link>
        ))}
      </nav>
      <ul className="space-y-3">
        {data.items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/admin/reviews/${item.id}`}
              className="block space-y-2 rounded-xl border bg-card p-5"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <span className="font-semibold">{item.name ?? t('unlinkedApp')}</span>
                <span className="text-sm">
                  {t(item.submission_id ? 'submission' : 'collection')}
                </span>
              </div>
              <p className="line-clamp-2 text-sm break-words text-muted-foreground">
                {item.candidate_payload.text ??
                  item.candidate_payload.release_notes ??
                  item.candidate_payload.source_url}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {!data.items.length && <p>{t('emptyQueue')}</p>}
      <nav aria-label={t('pagination')} className="flex gap-5">
        {page > 1 && (
          <Link className="min-h-11 text-primary" href={`${base}?state=${state}&page=${page - 1}`}>
            {t('previous')}
          </Link>
        )}
        {data.hasNext && (
          <Link className="min-h-11 text-primary" href={`${base}?state=${state}&page=${page + 1}`}>
            {t('next')}
          </Link>
        )}
      </nav>
    </section>
  );
}
