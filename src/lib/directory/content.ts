import type { DirectoryApp, Locale } from './types';
import ko from '@/messages/ko.json';
import en from '@/messages/en.json';
const messages = { ko, en };
const legacyUnknownSummaries = new Set([
  ko.InitialPublication.summary,
  en.InitialPublication.summary,
]);
export function appContent(app: DirectoryApp, locale: Locale) {
  const requested = app.translations[locale];
  const useOriginal = !requested || requested.state !== 'current';
  const summary = (useOriginal ? app.translations[app.originalLocale] : requested)?.summary ?? null;
  if (!app.fictional && app.status === 'unknown' && summary && legacyUnknownSummaries.has(summary))
    return { summary: messages[locale].Directory.unknownDescription, original: false };
  return {
    summary,
    original: useOriginal,
  };
}
