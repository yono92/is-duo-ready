import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seoConfig } from '@/messages/seo';
import { appContent } from '@/lib/directory/content';
import type { DirectoryApp, Locale } from '@/lib/directory/types';

type Environment = Record<string, string | undefined>;
type Page = 'home' | 'updates' | 'methodology' | 'submit';

export function publicSiteAllowed(env: Environment) {
  if (
    env.NODE_ENV !== 'production' ||
    env.VERCEL_ENV !== 'production' ||
    env.DIRECTORY_DATA_SOURCE !== 'postgres'
  )
    return false;
  try {
    const url = new URL(env.NEXT_PUBLIC_SITE_URL ?? '');
    return (
      url.protocol === 'https:' &&
      /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) &&
      !/(?:^|\.)(localhost|local|internal|test|invalid)$/i.test(url.hostname) &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function indexingAllowed(env: Environment) {
  return env.PUBLIC_INDEXING === 'true' && publicSiteAllowed(env);
}

export function siteOrigin(env: Environment = process.env) {
  const value = env.NEXT_PUBLIC_SITE_URL || seoConfig.productionOrigin;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials.');
  return url.origin;
}

export function languageAlternates(path: string, env: Environment = process.env) {
  const origin = siteOrigin(env);
  return {
    ko: new URL(`/ko${path}`, origin).toString(),
    en: new URL(`/en${path}`, origin).toString(),
    'x-default': new URL(`/en${path}`, origin).toString(),
  };
}

function metadataFor(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  index: boolean,
  env: Environment,
): Metadata {
  const origin = siteOrigin(env);
  const url = new URL(`/${locale}${path}`, origin).toString();
  const image = {
    url: new URL(
      `/api/og/${locale}?v=${encodeURIComponent(seoConfig.imageVersion)}`,
      origin,
    ).toString(),
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: seoConfig.locales[locale].image.alt,
  };
  return {
    metadataBase: new URL(origin),
    title,
    description,
    applicationName: seoConfig.siteName,
    alternates: { canonical: url, languages: languageAlternates(path, env) },
    robots: { index: index && indexingAllowed(env), follow: indexingAllowed(env) },
    openGraph: {
      type: 'website',
      siteName: seoConfig.siteName,
      title,
      description,
      url,
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      alternateLocale: locale === 'ko' ? 'en_US' : 'ko_KR',
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export function pageMetadata(locale: Locale, page: Page, env: Environment = process.env): Metadata {
  if (locale !== 'ko' && locale !== 'en') notFound();
  const copy = seoConfig.locales[locale];
  const { title, description } = copy[page];
  return metadataFor(
    locale,
    page === 'home' ? '' : `/${page}`,
    page === 'home' ? title : `${title} · ${seoConfig.siteName}`,
    env.DIRECTORY_DATA_SOURCE === 'fixtures' || !env.DIRECTORY_DATA_SOURCE
      ? copy.fixtureDescription
      : description,
    page !== 'submit',
    env,
  );
}

export function appMetadata(
  locale: Locale,
  app: DirectoryApp,
  env: Environment = process.env,
): Metadata {
  if (locale !== 'ko' && locale !== 'en') notFound();
  const copy = seoConfig.locales[locale];
  const replaceName = (text: string) => text.replace('{name}', () => app.names[locale]);
  const summary = appContent(app, locale).summary?.replace(/\s+/g, ' ').trim();
  const description = app.fictional
    ? copy.fixtureDescription
    : summary
      ? Array.from(summary).slice(0, 180).join('') + (Array.from(summary).length > 180 ? '…' : '')
      : replaceName(copy.appDescription);
  return metadataFor(
    locale,
    `/apps/${encodeURIComponent(app.slug)}`,
    `${replaceName(copy.appTitle)} · ${seoConfig.siteName}`,
    description,
    !app.fictional,
    env,
  );
}

export function siteVerification(): Metadata['verification'] {
  const { google, naver, bing } = seoConfig.verification;
  return {
    ...(google ? { google } : {}),
    other: {
      ...(naver ? { 'naver-site-verification': naver } : {}),
      ...(bing ? { 'msvalidate.01': bing } : {}),
    },
  };
}

export function websiteStructuredData(locale: Locale, env: Environment = process.env) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: new URL(`/${locale}`, siteOrigin(env)).toString(),
    inLanguage: locale,
    description: pageMetadata(locale, 'home', env).description,
  }).replace(/</g, '\\u003c');
}
