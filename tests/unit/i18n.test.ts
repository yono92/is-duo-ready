import { expect, it } from 'vitest';
import ko from '@/messages/ko.json';
import en from '@/messages/en.json';
import { fixtureApps } from '@/lib/data/fixtures';
import { appContent } from '@/lib/directory/content';
function keys(value: object, prefix = ''): string[] {
  return Object.entries(value)
    .flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
    .sort();
}
it('keeps dictionaries complete and matched', () => {
  expect(keys(ko)).toEqual(keys(en));
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
