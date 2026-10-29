import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { dataSource, getPublishedApp } from '@/lib/data/directory';
import { SubmissionForm } from '@/components/operations/submission-form';
import { Link } from '@/i18n/navigation';
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Submission');
  return { title: `${t('title')} · Is Duo Ready?`, robots: { index: false, follow: true } };
}
export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const t = await getTranslations('Submission');
  const d = await getTranslations('Directory');
  const { app } = await searchParams;
  let enabled = dataSource() === 'postgres';
  let storeUrl = '';
  if (enabled && app && app.length <= 150) {
    try {
      let result = await getPublishedApp(app);
      if (result && 'redirect' in result) result = await getPublishedApp(result.redirect);
      if (result && 'app' in result && !result.app.fictional) storeUrl = result.app.storeUrl;
    } catch {
      enabled = false;
    }
  }
  return (
    <main id="main" className="site-width py-10">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm text-muted-foreground">
        {d('back')}
      </Link>
      <section className="mx-auto my-8 max-w-2xl">
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-4 text-muted-foreground">{t('intro')}</p>
        <SubmissionForm enabled={enabled} storeUrl={storeUrl} />
      </section>
    </main>
  );
}
