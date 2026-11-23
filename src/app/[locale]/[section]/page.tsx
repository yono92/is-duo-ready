import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/components/ui/link';
import { AutoAds } from '@/components/auto-ads';
import { publicStatuses, type Locale } from '@/lib/directory/types';
import { pageMetadata } from '@/lib/data/seo';
import { dataSource } from '@/lib/data/directory';

const sections = ['methodology', 'about'] as const;
type Section = (typeof sections)[number];
const isSection = (value: string): value is Section => sections.includes(value as Section);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; section: string }>;
}): Promise<Metadata> {
  const { locale, section } = await params;
  if (!isSection(section)) notFound();
  return pageMetadata(locale, section);
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: Locale; section: string }>;
}) {
  const { locale, section } = await params;
  if (!isSection(section)) notFound();
  const d = await getTranslations('Directory');
  return (
    <main id="main" className="site-width py-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        {d('back')}
      </Link>
      {section === 'methodology' ? <Methodology locale={locale} /> : <About />}
    </main>
  );
}

async function Methodology({ locale }: { locale: Locale }) {
  const t = await getTranslations('Info');
  const s = await getTranslations('Status');
  return (
    <article className="mx-auto my-14 max-w-2xl">
      <AutoAds hasRealContent={dataSource() === 'postgres'} pagePath={`/${locale}/methodology`} />
      <h1 className="text-4xl leading-tight font-semibold tracking-tight">
        {t('methodologyTitle')}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t('methodologyBody')}</p>
      <dl className="mt-9 divide-y border-y">
        {publicStatuses.map((status) => (
          <div key={status} className="py-5 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-5">
            <dt className="font-semibold">{s(status)}</dt>
            <dd className="mt-2 leading-relaxed text-muted-foreground sm:mt-0">
              {t(`statusDescriptions.${status}`)}
            </dd>
          </div>
        ))}
      </dl>
      {['evidence', 'reading', 'versions', 'unknown', 'experience', 'review', 'region'].map(
        (part) => (
          <section key={part} className="mt-9">
            <h2 className="text-xl font-semibold">{t(part)}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t(`${part}Body`)}</p>
          </section>
        ),
      )}
      <section className="mt-9 border-t pt-9">
        <h2 className="text-xl font-semibold">{t('corrections')}</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t('correctionsBody')}</p>
        <Link
          href="/submit"
          className="mt-4 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          {t('correctionsLink')}
        </Link>
      </section>
    </article>
  );
}

async function About() {
  const t = await getTranslations('About');
  return (
    <article className="mx-auto my-14 max-w-2xl">
      <h1 className="text-4xl leading-tight font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t('intro')}</p>
      {(['operator', 'sources', 'limits', 'updates', 'contact'] as const).map((part) => (
        <section key={part} className="mt-9">
          <h2 className="text-xl font-semibold">{t(`sections.${part}.title`)}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t(`sections.${part}.body`)}</p>
        </section>
      ))}
      <div className="mt-9 flex flex-col items-start gap-1 border-t pt-9">
        {(
          [
            ['methodology', '/methodology'],
            ['reports', '/reports'],
            ['submit', '/submit'],
            ['github', 'https://github.com/yono92/is-duo-ready/issues/new'],
          ] as const
        ).map(([key, href]) => (
          <Link
            key={key}
            href={href}
            {...(href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            {t(`links.${key}`)}
          </Link>
        ))}
      </div>
    </article>
  );
}
