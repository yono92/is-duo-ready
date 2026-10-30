import { Banner } from '@/components/ui/surfaces';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin, localConfiguration } from '@/lib/admin/auth';
import type { Locale } from '@/lib/directory/types';
import { logoutAction } from '../actions';
import { Button } from '@/components/ui/button';
import { AdminNavigation } from '@/components/admin/navigation';
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  await requireAdmin(locale);
  const t = await getTranslations('Admin');
  const local = await localConfiguration();
  return (
    <main id="main" className="site-width py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <AdminNavigation />
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            {t('logout')}
          </Button>
        </form>
      </div>
      {local && <Banner status="info" title={t('localNotice')} className="mb-6" />}
      {children}
    </main>
  );
}
