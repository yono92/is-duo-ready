import { expect, it } from 'vitest';
import { fixturesAllowed } from '@/lib/data/policy';
import { fixtureApps } from '@/lib/data/fixtures';
it('requires explicit local production opt-in and always blocks deployment', () => {
  expect(fixturesAllowed({ NODE_ENV: 'development' })).toBe(true);
  expect(fixturesAllowed({ NODE_ENV: 'production' })).toBe(false);
  expect(fixturesAllowed({ NODE_ENV: 'production', LOCAL_FIXTURES: 'true' })).toBe(true);
  expect(fixturesAllowed({ NODE_ENV: 'development', LOCAL_FIXTURES: 'true', VERCEL: '1' })).toBe(
    false,
  );
});
it('contains only fictional KR data without fabricated evidence or dates', () => {
  expect(new Set(fixtureApps.map((a) => a.slug)).size).toBe(30);
  for (const app of fixtureApps) {
    expect(app.fictional).toBe(true);
    expect(app.country).toBe('KR');
    expect(app.evidence).toEqual([]);
    expect(app.reviewedAt).toBeNull();
    expect(app.supportChangedAt).toBeNull();
  }
});
