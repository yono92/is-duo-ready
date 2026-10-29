import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { database } from '@/lib/db/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/lib/directory/types';
export default async function AdminHome() {
  const actor = await requireAdmin((await getLocale()) as Locale);
  const t = await getTranslations('Admin');
  const counts = await database(
    actor,
    async (db) =>
      (
        await db.query<{ publication: string; count: string }>(
          'SELECT publication,count(*) FROM app_private.apps GROUP BY publication',
        )
      ).rows,
  );
  return (
    <section>
      <h1 className="text-3xl font-semibold">{t('overview')}</h1>
      <p className="mt-3 text-muted-foreground">{t('overviewDescription')}</p>
      <dl className="my-8 grid gap-5 sm:grid-cols-3">
        {['draft', 'published', 'archived'].map((state) => (
          <div key={state} className="rounded-[18px] border bg-card p-5">
            <dt>{t(`publication.${state}`)}</dt>
            <dd className="mt-3 text-3xl">
              {counts.find((row) => row.publication === state)?.count ?? '0'}
            </dd>
          </div>
        ))}
      </dl>
      <Link className="text-primary" href="/admin/apps">
        {t('apps')}
      </Link>
    </section>
  );
}
