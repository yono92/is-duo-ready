import { Card, TopNavItem } from '@/components/ui/surfaces';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin, localConfiguration } from '@/lib/admin/auth';
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
          <TopNavItem href="/admin" label={t('overview')} />
          <TopNavItem href="/admin/apps" label={t('apps')} />
          <TopNavItem href="/admin/apps/import" label={t('importApps')} />
          <TopNavItem href="/admin/collections" label={ops('collections')} />
          <TopNavItem href="/admin/reviews" label={ops('reviews')} />
          <TopNavItem href="/admin/submissions" label={ops('submissions')} />
        </nav>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            {t('logout')}
          </Button>
        </form>
      </div>
      {local && (
        <Card padding={5}>
          <p className="mb-6 text-sm">{t('localNotice')}</p>
        </Card>
      )}
      {children}
    </main>
  );
}
