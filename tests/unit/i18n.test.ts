import { expect, it } from 'vitest';
import ko from '@/messages/ko.json';
import en from '@/messages/en.json';
import { fixtureApps } from '@/lib/data/fixtures';
import { createTranslator } from 'next-intl';
import { appContent } from '@/lib/directory/content';
import type { RealDirectoryApp } from '@/lib/directory/types';
function keys(value: object, prefix = ''): string[] {
  return Object.entries(value)
    .flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
    .sort();
}
it('keeps dictionaries complete and matched', () => {
  expect(keys(ko)).toEqual(keys(en));
});
it('formats free/paid ranking attribution in both languages without ICU errors', () => {
  for (const [locale, messages] of [
    ['ko', ko],
    ['en', en],
  ] as const) {
    const t = createTranslator({
      locale,
      messages,
      namespace: 'Directory',
      onError(error) {
        throw error;
      },
    });
    for (const kind of ['free', 'paid']) {
      const result = t('rankingAsOf', { kind, date: '2026-11-02' });
      expect(result).toContain('2026-11-02');
      expect(result).toContain(
        locale === 'ko'
          ? kind === 'free'
            ? '전체 무료'
            : '전체 유료'
          : kind === 'free'
            ? 'overall free'
            : 'overall paid',
      );
    }
  }
});
it('uses original content for missing and stale translations', () => {
  for (const index of [1, 2]) {
    expect(appContent(fixtureApps[index], 'en')).toEqual({
      summary: fixtureApps[index].translations.ko?.summary,
      original: true,
    });
  }
  expect(appContent(fixtureApps[0], 'en').original).toBe(false);
});

it('replaces only the obsolete unsupported claim on unknown apps without altering source data', () => {
  const app: RealDirectoryApp = {
    ...fixtureApps[0],
    fictional: false,
    status: 'unknown',
    evidence: [],
    features: [],
    storeUrl: 'https://apps.apple.com/kr/app/id990000010',
    currentVersion: null,
    supportVersion: null,
    investigationReason: null,
    previousSlugs: [],
    originalLocale: 'ko',
    translations: { ko: { summary: ko.InitialPublication.summary, state: 'current' } },
  };
  expect(appContent(app, 'ko').summary).toBe(ko.Directory.unknownDescription);
  expect(appContent(app, 'en')).toEqual({
    summary: en.Directory.unknownDescription,
    original: false,
  });
  expect(app.translations.ko?.summary).toBe(ko.InitialPublication.summary);
  app.translations.ko!.summary = 'Actual source-language research summary';
  expect(appContent(app, 'en')).toEqual({
    summary: 'Actual source-language research summary',
    original: true,
  });
});
