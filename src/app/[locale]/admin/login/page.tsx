import { Card, Banner } from '@/components/ui/surfaces';
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
      <section>
        <Card padding={5} className="mx-auto max-w-md ">
          <h1 className="text-3xl font-semibold">{t('loginTitle')}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {t(local ? 'localNotice' : 'loginDescription')}
          </p>
          {!enabled && (
            <Banner
              className="mt-4"
              role="status"
              status="warning"
              title={t('errors.authUnavailable')}
            />
          )}
          {visibleError && (
            <Banner role="alert" status="error" title={<>{t(`errors.${visibleError}`)}</>} />
          )}
          <LoginForm enabled={enabled} />
        </Card>
      </section>
    </main>
  );
}
