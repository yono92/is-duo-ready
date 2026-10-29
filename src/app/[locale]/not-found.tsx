import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
export default async function NotFound() {
  const t = await getTranslations('NotFound');
  return (
    <main id="main" className="site-width py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 text-3xl font-semibold">{t('title')}</h1>
      <p className="my-6 text-muted-foreground">{t('description')}</p>
      <ButtonLink href="/">{t('home')}</ButtonLink>
    </main>
  );
}
