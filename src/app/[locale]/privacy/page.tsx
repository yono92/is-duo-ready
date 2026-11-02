import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/components/ui/link';
import { pageMetadata } from '@/lib/data/seo';
import type { Locale } from '@/lib/directory/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  return pageMetadata((await params).locale, 'privacy');
}

export default async function PrivacyPage() {
  const t = await getTranslations('Privacy');
  const sections = [
    'browsing',
    'preferences',
    'submissions',
    'administrators',
    'advertising',
    'providers',
    'choices',
    'contact',
  ] as const;
  return (
    <main id="main" className="site-width py-12">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t('effective')}</p>
        <p className="mt-6 leading-relaxed text-muted-foreground">{t('intro')}</p>
        {sections.map((section) => (
          <section key={section} className="mt-9">
            <h2 className="text-xl font-semibold">{t(`${section}.title`)}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
              {t(`${section}.body`)}
            </p>
          </section>
        ))}
        <ul className="mt-6 space-y-3 text-sm">
          {[
            ['google', 'https://policies.google.com/technologies/partner-sites'],
            ['ads', 'https://myadcenter.google.com/'],
            ['vercel', 'https://vercel.com/legal/privacy-notice'],
            ['supabase', 'https://supabase.com/privacy'],
            ['github', 'https://github.com/yono92/is-duo-ready/issues/new'],
          ].map(([key, href]) => (
            <li key={key}>
              <Link
                href={href}
                className="underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(`links.${key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
