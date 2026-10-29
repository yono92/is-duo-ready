import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin, localConfiguration } from '@/lib/admin/auth';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/lib/directory/types';
import { logoutAction } from '../actions';
import { Button } from '@/components/ui/button';
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  await requireAdmin(locale);
  const t = await getTranslations('Admin');
  const local = await localConfiguration();
  const ops = await getTranslations('Operations');
  return (
    <main id="main" className="site-width py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <nav aria-label={t('navigation')} className="flex flex-wrap gap-5 text-sm">
          <Link href="/admin">{t('overview')}</Link>
          <Link href="/admin/apps">{t('apps')}</Link>
          <Link href="/admin/apps/import">{t('importApps')}</Link>
          <Link href="/admin/collections">{ops('collections')}</Link>
          <Link href="/admin/reviews">{ops('reviews')}</Link>
          <Link href="/admin/submissions">{ops('submissions')}</Link>
        </nav>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            {t('logout')}
          </Button>
        </form>
      </div>
      {local && <p className="mb-6 rounded-xl bg-muted p-4 text-sm">{t('localNotice')}</p>}
      {children}
    </main>
  );
}
