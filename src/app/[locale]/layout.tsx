import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/components/ui/link';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { pageMetadata, siteVerification } from '@/lib/data/seo';
import '../globals.css';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = hasLocale(routing.locales, locale) ? locale : 'en';
  return {
    ...pageMetadata(validLocale, 'home'),
    verification: siteVerification(),
    other: {
      'google-adsense-account': 'ca-pub-8224851078290204',
    },
  };
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Home');
  const n = await getTranslations('Nav');
  return (
    <html
      lang={locale}
      data-astryx-theme="neutral"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider>
          <Providers>
            <Header />
            {children}
            <footer className="site-footer">
              <div className="site-width flex flex-wrap justify-between gap-5 text-xs leading-relaxed text-muted-foreground">
                <p>{t('footer')}</p>
                <Link href="/methodology" className="underline underline-offset-4">
                  {n('methodology')}
                </Link>
              </div>
            </footer>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
