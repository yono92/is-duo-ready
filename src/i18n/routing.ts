import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeCookie: { name: 'DUO_LOCALE', maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' },
});
