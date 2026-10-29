import { getLocale } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { listAdminApps } from '@/lib/admin/repository';
import { collectionOverview } from '@/lib/operations/repository';
import { AdminQueryProvider } from '@/components/admin/query-provider';
import { CollectionDashboard } from '@/components/operations/collection-dashboard';
import type { Locale } from '@/lib/directory/types';

export default async function Collections() {
  const locale = (await getLocale()) as Locale;
  const actor = await requireAdmin(locale);
  const [apps, data] = await Promise.all([listAdminApps(actor), collectionOverview(actor)]);
  // eslint-disable-next-line react-hooks/purity -- Request-time SSR fetch timestamp, not client render state.
  const fetchedAt = Date.now();
  return (
    <AdminQueryProvider key={actor}>
      <CollectionDashboard
        apps={apps.map(({ id, name, app_store_id }) => ({ id, name, app_store_id }))}
        initialData={data}
        initialDataUpdatedAt={fetchedAt}
      />
    </AdminQueryProvider>
  );
}
