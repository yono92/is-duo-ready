import type { DirectoryApp, Locale } from './types';
export function appContent(app: DirectoryApp, locale: Locale) {
  const requested = app.translations[locale];
  const useOriginal = !requested || requested.state !== 'current';
  return {
    summary: (useOriginal ? app.translations[app.originalLocale] : requested)?.summary ?? null,
    original: useOriginal,
  };
}
