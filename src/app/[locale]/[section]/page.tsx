import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/components/ui/link';
import { statuses, type Locale } from '@/lib/directory/types';
import { pageMetadata } from '@/lib/data/seo';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; section: string }>;
}): Promise<Metadata> {
  const { locale, section } = await params;
  if (section !== 'methodology') notFound();
  return pageMetadata(locale, 'methodology');
}
export default async function InfoPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section !== 'methodology') notFound();
  const t = await getTranslations('Info');
  const d = await getTranslations('Directory');
  const s = await getTranslations('Status');
  return (
    <main id="main" className="site-width py-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        {d('back')}
      </Link>
      <article className="mx-auto my-14 max-w-2xl">
        <h1 className="text-4xl leading-tight font-semibold tracking-tight">
          {t('methodologyTitle')}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t('methodologyBody')}</p>
        <dl className="mt-9 divide-y border-y">
          {statuses.map((status) => (
            <div key={status} className="py-5 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-5">
              <dt className="font-semibold">{s(status)}</dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground sm:mt-0">
                {t(`statusDescriptions.${status}`)}
              </dd>
            </div>
          ))}
        </dl>
        {['evidence', 'review', 'region'].map((part) => (
          <section key={part} className="mt-9">
            <h2 className="text-xl font-semibold">{t(part)}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t(`${part}Body`)}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
