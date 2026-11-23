// Exact localized paths only. The value must record why the page offers
// useful original information beyond a status, store metadata or copied quote.
// Review each language separately and re-review after material content changes.
// This is our editorial decision, never a claim of Google approval.
// App detail pages are not listed: most share near-identical copy (see specs/011).
const methodology =
  '2026-11-23 review: original guide to reading support evidence — status meanings, why store and evidence versions differ, what missing information does and does not mean, and how official sources differ from user experience. No ads on directory, search or history screens.';
const report = (date: string) =>
  `2026-11-23 review of the ${date} update report: original analysis of newly confirmed apps grouped by how they use the Duo displays, the limits of short announcements, and wording deliberately not counted as support, with verified counts from the refresh record. Official quotes support the analysis rather than replace it.`;

export const adContentReviews: Readonly<Record<string, string>> = {
  '/ko/methodology': methodology,
  '/en/methodology': methodology,
  '/ko/reports/2026-11-23': report('2026-11-23'),
  '/en/reports/2026-11-23': report('2026-11-23'),
  '/ko/reports/2026-11-20': report('2026-11-20'),
  '/en/reports/2026-11-20': report('2026-11-20'),
};
