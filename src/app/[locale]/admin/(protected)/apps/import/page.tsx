import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { uuid } from '@/lib/admin/input';
import { getImportRun, listImportRuns } from '@/lib/import/repository';
import { ImportError } from '@/lib/import/apple.ts';
import { ImportForm, ImportProgress } from '@/components/admin/import-form';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/lib/directory/types';

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const locale = (await getLocale()) as Locale;
  const actor = await requireAdmin(locale);
  const t = await getTranslations('Import');
  const { run: id } = await searchParams;
  let run;
  if (id) {
    try {
      uuid(id);
    } catch {
      notFound();
    }
    try {
      run = await getImportRun(actor, id);
    } catch (error) {
      if (error instanceof ImportError && error.code === 'runNotFound') notFound();
      throw error;
    }
  }
  const recent = await listImportRuns(actor);
  return (
    <section>
      <h1 className="text-3xl font-semibold">{t('title')}</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">{t('description')}</p>
      {run ? (
        <>
          <ImportProgress key={run.id} initial={run} />
          <Link href="/admin/apps/import" className="mt-6 inline-block text-primary">
            {t('newImport')}
          </Link>
        </>
      ) : (
        <ImportForm />
      )}
      {!!recent.length && (
        <section className="mt-12 space-y-4" aria-labelledby="recent-imports">
          <h2 id="recent-imports" className="text-xl font-semibold">
            {t('recent')}
          </h2>
          <ul className="space-y-3">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/apps/import?run=${item.id}`}
                  className="inline-flex min-h-11 flex-wrap items-center gap-3 text-primary"
                >
                  <time dateTime={item.createdAt}>
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Asia/Seoul',
                    }).format(new Date(item.createdAt))}
                  </time>
                  <span>{t('recentCount', { total: item.total, pending: item.pending })}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
