import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { listAdminApps } from '@/lib/admin/repository';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/lib/directory/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-icon';
import { AppStoreBadge } from '@/components/app-store-badge';
export default async function AdminApps({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const actor = await requireAdmin((await getLocale()) as Locale);
  const t = await getTranslations('Admin');
  const { q = '' } = await searchParams;
  const apps = await listAdminApps(actor, q);
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{t('apps')}</h1>
        <Link className="text-primary" href="/admin/apps/new">
          {t('newApp')}
        </Link>
      </div>
      <form className="my-6 flex gap-3">
        <Input name="q" defaultValue={q} label={t('search')} isLabelHidden maxLength={100} />
        <Button type="submit">{t('search')}</Button>
      </form>
      <p className="mb-4 text-sm text-muted-foreground">{t('listLimit')}</p>
      <ul className="space-y-3">
        {apps.map((app) => (
          <li
            key={app.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2"
          >
            <Link
              href={`/admin/apps/${app.id}`}
              className="flex min-h-16 min-w-0 flex-1 items-center gap-3 p-2"
            >
              <AppIcon name="box" src={app.icon_url} />
              <span className="min-w-0 flex-1 break-words font-medium">{app.name}</span>
              <span className="text-sm text-muted-foreground">
                {t(`publication.${app.publication}`)}
              </span>
            </Link>
            {app.icon_url && (
              <AppStoreBadge
                url={`https://apps.apple.com/kr/app/id${app.app_store_id}`}
                name={app.name}
              />
            )}
          </li>
        ))}
      </ul>
      {!apps.length && <p>{t('empty')}</p>}
    </section>
  );
}
