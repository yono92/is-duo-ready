'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('Directory');
  return (
    <main id="main" className="site-width py-20 text-center">
      <h1 className="text-2xl font-semibold">{t('errorTitle')}</h1>
      <p className="my-5 text-muted-foreground">{t('errorDescription')}</p>
      <Button onClick={reset}>{t('retry')}</Button>
    </main>
  );
}
