import { getTranslations } from 'next-intl/server';
import { localConfiguration } from '@/lib/admin/auth';
import { LoginForm } from '@/components/admin/login-form';
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations('Admin');
  const local = await localConfiguration();
  const enabled = Boolean(
    local ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
  const { error } = await searchParams;
  const visibleError = ['authRequired', 'forbidden', 'unavailable'].includes(error ?? '')
    ? error
    : null;
  return (
    <main id="main" className="site-width py-12">
      <section className="mx-auto max-w-md rounded-[18px] border bg-card p-6">
        <h1 className="text-3xl font-semibold">{t('loginTitle')}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {t(local ? 'localNotice' : 'loginDescription')}
        </p>
        {!enabled && (
          <p className="mt-4 text-sm" role="status">
            {t('errors.authUnavailable')}
          </p>
        )}
        {visibleError && (
          <p className="mt-4 text-sm" role="alert">
            {t(`errors.${visibleError}`)}
          </p>
        )}
        <LoginForm enabled={enabled} />
      </section>
    </main>
  );
}
