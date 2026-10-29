# Directory UI and URL contract

- `/` negotiates locale; `/ko` and `/en` are authoritative. Unsupported prefix returns 404.
- `q`: names/aliases case-insensitive NFC substring search in BOTH languages, max 100 chars.
- `category`: productivity, graphics-design, music, books, travel, navigation, photo-video, entertainment, lifestyle; omitted/invalid = all.
  Legacy `creativity` is accepted as `graphics-design`; newly serialized URLs use the canonical slug.
  These internal slugs select a subset of official Apple category names, not the complete taxonomy
  or Apple API identifiers. Labels/sources: docs/references/app-store-categories.md.
- `status`: supported, planned, unknown, unsupported; omitted/invalid = all.
- `sort`: recommended (default), updated, name.
- `page`: default 1; invalid = 1; beyond last page clamped. 24 items/page.
- Duplicate known params use first value. Unknown query keys are ignored by filtering.
- Recommended: supported first, then remaining groups (planned, unknown, unsupported), review descending,
  then localized name and slug. Updated uses supportChangedAt descending; names use locale collation.
- Query/filter/sort changes reset page; all controls derive from navigated URL. Back/forward restore controls.
- Locale links preserve path/query; cookie one-year, sameSite=lax. Locale NEVER changes country or category.
- Theme: initial system default follows OS; a single accessible light/dark role=switch reports the
  resolved dark state via aria-checked. Manual choice persists and stops following OS. No explicit
  system selection UI or theme URL parameter.
- `/[locale]/apps/[slug]`: fixture-only detail shell; retains query on locale switch; unknown/draft = 404.
- `/[locale]/updates`, `/submit`: honest scoped future-feature notices. No fake updates or submitting data.
- `/[locale]/methodology`: policy from PRD, independent service notice.
- Mobile Sheet: accessible title/description, focus trap, Escape/close, focus return; live filters + done action.
- No exposed public API, DB table, auth endpoint or external write in this feature.
