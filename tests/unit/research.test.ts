import { expect, it } from 'vitest';
import { researchForApp, supportResearch } from '../../src/lib/directory/research';

it('keeps a bounded, traceable 50-app research batch with real source identities', () => {
  expect(supportResearch.apps).toHaveLength(50);
  expect(new Set(supportResearch.apps.map((app) => app.appStoreId)).size).toBe(50);
  for (const app of supportResearch.apps) {
    expect(app.appStoreId).toMatch(/^[1-9][0-9]+$/);
    expect(app.checks.some((check) => check.kind === 'developer')).toBe(true);
    for (const check of app.checks) {
      const url = new URL(check.url);
      expect(url.protocol).toBe('https:');
      expect(url.username + url.password).toBe('');
      expect(check.scope.trim()).not.toBe('');
      expect(check.note.ko.trim()).not.toBe('');
      expect(check.note.en.trim()).not.toBe('');
      expect(new Date(check.checkedAt).getTime()).toBeGreaterThan(0);
      expect(new Date(check.checkedAt).getTime()).toBeLessThanOrEqual(Date.now());
      if (check.kind === 'app_store') {
        expect(url.hostname).toBe('apps.apple.com');
        expect(url.pathname).toMatch(new RegExp(`/kr/app/(?:[^/]+/)?id${app.appStoreId}$`));
      }
      if (check.quote) expect(['explicit_support', 'limited_statement']).toContain(check.outcome);
    }
    expect(researchForApp(`https://apps.apple.com/kr/app/id${app.appStoreId}`)).toBe(app);
  }
});

it('does not attach research to another store, unlisted app or matching query parameter', () => {
  const id = supportResearch.apps[0].appStoreId;
  expect(researchForApp(`https://apps.apple.com/us/app/id${id}`)).toBeNull();
  expect(researchForApp(`https://example.com/kr/app/id${id}`)).toBeNull();
  expect(researchForApp(`https://apps.apple.com/kr/app/id999999999999?other=${id}`)).toBeNull();
});
