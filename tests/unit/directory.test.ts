import { describe, expect, it } from 'vitest';
import {
  parseQuery,
  queryString,
  changeQuery,
  selectApps,
  defaultQuery,
} from '@/lib/directory/query';
import { fixtureApps } from '@/lib/data/fixtures';
describe('directory URL contract', () => {
  it('normalizes malformed and duplicated inputs', () => {
    expect(
      parseQuery({
        q: ['  메모  ', 'ignored'],
        page: '-1',
        category: 'bogus',
        status: 'bogus',
        sort: 'bad',
      }),
    ).toEqual({ ...defaultQuery, q: '메모' });
    expect(parseQuery({ page: '1.5' }).page).toBe(1);
    expect(parseQuery({ page: '99999999' }).page).toBe(10000);
    expect(parseQuery({ q: 'a'.repeat(101) }).q).toHaveLength(100);
  });
  it('roundtrips query and resets page on search/filter/sort', () => {
    const query = { ...defaultQuery, q: '메모 & notes', status: 'supported' as const, page: 2 };
    expect(parseQuery(Object.fromEntries(new URLSearchParams(queryString(query))))).toEqual(query);
    expect(changeQuery(query, { category: 'graphics-design' }).page).toBe(1);
    expect(changeQuery(query, { page: 3 }).page).toBe(3);
  });
  it('normalizes the legacy creativity category and emits the canonical URL slug', () => {
    const legacy = parseQuery({ category: 'creativity', status: 'supported' });
    const canonical = parseQuery({ category: 'graphics-design', status: 'supported' });
    expect(legacy).toEqual(canonical);
    expect(queryString(legacy)).toBe('category=graphics-design&status=supported');
    expect(selectApps(fixtureApps, legacy, 'ko').apps.map((app) => app.slug)).toEqual(
      selectApps(fixtureApps, canonical, 'ko').apps.map((app) => app.slug),
    );
  });
  it('filters the explicit App Store category assignments independently of UI language', () => {
    const examples = {
      productivity: 'sample-01',
      'graphics-design': 'sample-02',
      music: 'sample-03',
      books: 'sample-07',
      travel: 'sample-04',
      navigation: 'sample-20',
      'photo-video': 'sample-22',
      entertainment: 'sample-15',
      lifestyle: 'sample-08',
    } as const;
    for (const [category, slug] of Object.entries(examples)) {
      const query = parseQuery({ category });
      const korean = selectApps(fixtureApps, query, 'ko');
      const english = selectApps(fixtureApps, query, 'en');
      expect(korean.apps.some((app) => app.slug === slug)).toBe(true);
      expect(korean.apps.every((app) => app.category === category && app.country === 'KR')).toBe(
        true,
      );
      expect(korean.apps.map((app) => app.slug).sort()).toEqual(
        english.apps.map((app) => app.slug).sort(),
      );
    }
  });
  it('searches both languages and aliases in either UI language', () => {
    for (const locale of ['ko', 'en'] as const) {
      for (const q of ['종이숲', 'PAPER GROVE', 'notes', '메모'])
        expect(
          selectApps(fixtureApps, { ...defaultQuery, q }, locale).apps.some(
            (a) => a.slug === 'sample-01',
          ),
        ).toBe(true);
    }
  });
  it('intersects filters, paginates and clamps, hides drafts', () => {
    const filtered = selectApps(
      fixtureApps,
      { ...defaultQuery, category: 'graphics-design', status: 'supported' },
      'en',
    );
    expect(filtered.total).toBeGreaterThan(0);
    expect(
      filtered.apps.every((a) => a.category === 'graphics-design' && a.status === 'supported'),
    ).toBe(true);
    expect(selectApps(fixtureApps, defaultQuery, 'en').apps).toHaveLength(24);
    expect(selectApps(fixtureApps, { ...defaultQuery, page: 100 }, 'en').apps).toHaveLength(6);
    expect(
      selectApps([{ ...fixtureApps[0], publication: 'draft' }], defaultQuery, 'en').total,
    ).toBe(0);
  });
  it('sorts by support review/change dates, never collection dates', () => {
    const a = {
      ...fixtureApps[0],
      reviewedAt: '2026-01-01T00:00:00Z',
      supportChangedAt: '2026-05-01T00:00:00Z',
    };
    const b = {
      ...fixtureApps[1],
      reviewedAt: '2026-02-01T00:00:00Z',
      supportChangedAt: '2026-03-01T00:00:00Z',
    };
    expect(selectApps([a, b], defaultQuery, 'en').apps[0].slug).toBe(b.slug);
    expect(selectApps([a, b], { ...defaultQuery, sort: 'updated' }, 'en').apps[0].slug).toBe(
      a.slug,
    );
    expect(selectApps([a, { ...b, status: 'unsupported' }], defaultQuery, 'en').apps[0].slug).toBe(
      a.slug,
    );
  });
});
