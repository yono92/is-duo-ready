import { expect, it } from 'vitest';
import { supportReports, reportByDate } from '../../src/lib/directory/reports';
import { scanForApp, scanOutcomes, sourceScans } from '../../src/lib/directory/source-scans';

const mention = /iphone\s*duo|\bduo\b|듀오|\bfold(?:able|ing|ed)?\b|폴더블|접히|접힘|펼친|펼침/iu;

it('keeps each update report internally consistent with its verified totals', () => {
  expect(supportReports.length).toBeGreaterThan(0);
  const dates = supportReports.map((report) => report.date);
  expect([...dates].sort().reverse()).toEqual(dates);
  for (const report of supportReports) {
    expect(report.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.record).toBe(`docs/data-update-${report.date}.md`);
    const { totals } = report;
    expect(report.apps).toHaveLength(totals.supported - totals.previousSupported);
    expect(totals.reconfirmed).toBeLessThanOrEqual(totals.existingSupported);
    expect(totals.existingSupported).toBe(totals.previousSupported);
    expect(totals.supported + totals.unknown).toBeLessThanOrEqual(totals.published);
    const ids = report.apps.map((app) => app.appStoreId);
    expect(new Set(ids).size).toBe(ids.length);
    // Every confirmed app appears in exactly one editorial group.
    const grouped = report.groups.flatMap((group) => group.apps);
    expect([...grouped].sort()).toEqual([...ids].sort());
    for (const app of report.apps) {
      expect(app.sourceUrl).toBe(`https://apps.apple.com/kr/app/id${app.appStoreId}`);
      expect(app.slug).toMatch(/^[a-z0-9-]+$/);
      expect(app.quote.trim()).not.toBe('');
      expect(app.summary.ko.trim()).not.toBe('');
      expect(app.summary.en.trim()).not.toBe('');
      expect(new Date(app.observedAt).toISOString().slice(0, 10) <= report.date).toBe(true);
    }
    for (const text of [report.title, report.summary, report.intro, ...report.notCounted])
      expect(text.ko.trim() && text.en.trim()).toBeTruthy();
    expect(reportByDate(report.date)).toBe(report);
  }
  expect(reportByDate('2026-01-01')).toBeNull();
});

it('describes the latest source check without implying a support decision', () => {
  const scans = Object.entries(sourceScans.apps);
  expect(scans.length).toBeGreaterThan(1000);
  expect(sourceScans.refresh).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  for (const [id, scan] of scans) {
    expect(id).toMatch(/^[1-9][0-9]+$/);
    expect(scanOutcomes).toContain(scan.outcome);
    expect(scan.versions).toBeGreaterThanOrEqual(0);
    expect(scan.versions).toBeLessThanOrEqual(25);
    const held = ![
      'evidence_observed',
      'alternative_observed',
      'evidence_not_reobserved',
      'no_mention',
      'compatibility_only',
    ].includes(scan.outcome);
    // Held wording is shown verbatim so readers can judge it; nothing else gets an excerpt.
    expect(Boolean(scan.excerpt)).toBe(held);
    if (scan.excerpt) expect(scan.excerpt).toMatch(mention);
    expect(scanForApp(`https://apps.apple.com/kr/app/id${id}`)).toBe(scan);
  }
});

it('attaches a scan only to the same KR store identity', () => {
  const id = Object.keys(sourceScans.apps)[0];
  expect(scanForApp(`https://apps.apple.com/us/app/id${id}`)).toBeNull();
  expect(scanForApp(`https://apps.apple.com/kr/app/id${id}?other=1`)).toBeNull();
  expect(scanForApp('https://apps.apple.com/kr/app/idtoString')).toBeNull();
  expect(scanForApp('https://apps.apple.com/kr/app/id999999999999999')).toBeNull();
});
