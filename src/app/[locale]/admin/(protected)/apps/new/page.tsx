import { getLocale, getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Locale } from '@/lib/directory/types';
import { emptyDraft } from '@/lib/admin/input';
import { EditForm } from '@/components/admin/edit-form';
export default async function NewApp() {
  await requireAdmin((await getLocale()) as Locale);
  const t = await getTranslations('Admin');
  return (
    <section>
      <h1 className="text-3xl font-semibold">{t('newApp')}</h1>
      <EditForm initial={emptyDraft} />
    </section>
  );
}
