# Data model — 001

- Locale: ko | en. Country: literal KR, never computed from Locale.
- SupportStatus: supported | planned | unknown | unsupported; shared across translations.
- Category: productivity | graphics-design | music | books | travel | navigation | photo-video | entertainment | lifestyle.
  These are project-owned URL slugs for a nine-category subset of official Apple category names,
  not the complete taxonomy or Apple API identifiers. Localized labels and sources are recorded in
  docs/references/app-store-categories.md. Legacy creativity normalizes to graphics-design.
  Fictional app categories are explicit UI examples; future real data retains the KR primary genre
  identifier/name and uses a verified mapping, never an inferred category from app appearance.
- Theme preference: initial system default follows OS until a manual light|dark selection is saved.
  A single role=switch exposes the resolved light/dark state; no explicit system selection UI.
  Saved manual selections persist across visits and ignore OS changes.
- DirectoryApp: id/slug unique; fictional=true; publication=published|draft; country=KR;
  names[ko,en]; aliases[]; developer; category; status; icon key; translations partial by locale;
  originalLocale; translation state current|needs-review; reviewedAt nullable UTC ISO;
  supportChangedAt nullable UTC ISO; evidence always empty for these fixtures.
- Fixture support statuses are UI demonstration states, not publishable judgments. No synthetic evidence,
  no support versions, no fabricated review dates. Real publication validation belongs to 002.
- Translation fallback: if absent or needs-review use original content and show localized source-language notice.
- Query: q trimmed/NFC, max 100 chars; category/status enum or all; sort recommended|updated|name;
  page positive integer ≤10000, effective page clamped to actual page count. Page size 24.
- Query changes other than page reset page=1. Reset restores defaults including search and sort.
- Asset: local path, source record, rights, localized alt, width/height, placeholder boolean.
- DirectoryResult: available(apps) | unavailable(reason). An empty available result is not an error.

No SQL/migration in 001; apps/translations/listings/support/evidence normalized schema remains 002.
