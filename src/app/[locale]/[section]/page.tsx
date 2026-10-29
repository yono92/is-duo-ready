import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
const sections = ['updates', 'submit', 'methodology'] as const;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}): Promise<Metadata> {
  const { locale, section } = await params;
  const t = await getTranslations({ locale, namespace: 'Nav' });
  return {
    title: sections.includes(section as never)
      ? `${t(section as (typeof sections)[number])} · Is Duo Ready?`
      : 'Is Duo Ready?',
    alternates: {
      canonical: `/${locale}/${section}`,
      languages: { ko: `/ko/${section}`, en: `/en/${section}` },
    },
  };
}
export default async function InfoPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as never)) notFound();
  const t = await getTranslations('Info');
  const d = await getTranslations('Directory');
  const key = section as (typeof sections)[number];
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
        <p className="eyebrow">Is Duo Ready?</p>
        <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-tight">
          {t(`${key}Title`)}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t(`${key}Body`)}</p>
        {key === 'methodology' ? (
          ['evidence', 'review', 'independent'].map((part) => (
            <section key={part} className="mt-9 border-t pt-7">
              <h2 className="text-xl font-semibold">{t(part)}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{t(`${part}Body`)}</p>
            </section>
          ))
        ) : (
          <p className="mt-8 inline-block rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            {t('coming')}
          </p>
        )}
      </article>
    </main>
  );
}
