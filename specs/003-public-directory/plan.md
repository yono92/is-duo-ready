# Implementation Plan: 003-public-directory

**Branch**: main (existing shared checkout; previous agent completed) | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

## Summary
Replace fixture-only reads with explicit fixture/PostgreSQL modes, use reviewed projections for lists/details/updates, preserve URL/i18n/theme behavior and invalidate both locales after writes.

## Technical Context
- Language: strict TypeScript 6.0.3, Node 22.14.0; Next.js 16.4.3 App Router / React 19.3.1.
- Dependencies: existing next-intl, Astryx 0.7.4, Tailwind 4; pg pinned and promoted to runtime when used by app; Supabase SSR pinned at installation.
- Storage: existing loopback PostgreSQL 17.11. Future hosted PostgreSQL/Supabase Auth configuration remains explicit; no external projects/deployment.
- Testing: Vitest unit, PostgreSQL integration with non-owner roles, Playwright Chromium; required lint/typecheck/unit/e2e/build gates.
- Platform: local web application, two locales, KR storefront, 360/768/1440px.
- Performance: 24-item pages, candidate import cap 200, bounded network calls and no external calls from public pages. No speculative high-volume service infrastructure.
- Constraints: no invented support/evidence/review dates; fixture production gate, session privacy and transaction atomicity.

## Constitution Check
Pre-design and post-design: I evidence is explicitly reviewed; II imports save private proposals; III RLS plus sanitized public projection; IV all UI strings/messages and accessibility parity; V failures preserve snapshot/history; VI migrations and feature tests; VII isolated fixtures and no unlicensed remote imagery. Implementation verified by isolated SQL, browser, production-mode and real API checks. Requirement-by-requirement completion evidence and external boundaries are recorded in docs/verification.md.

## Project Structure
Documentation: spec.md, plan.md, research.md, data-model.md, contracts/workflow.md, quickstart.md, tasks.md, checklists/requirements.md.
Implementation: src/lib/data/, src/lib/directory/, src/app/[locale]/page.tsx, src/app/[locale]/apps/[slug]/page.tsx, src/app/[locale]/updates/, src/app/sitemap.ts, src/app/robots.ts, src/messages/, tests/e2e/.

## Dependencies and delivery
002 → 003 → 004; each feature records tests independently, integrated importer→review→public checks close the combined scope. No feature is marked complete based only on another feature's tests.

## Detail date/history amendment — 2026-10-30

Remove evidence date rendering and its unused ko/en fallback key. Keep date storage untouched.
Filter initial registrations only for app-scoped history in the shared SQL predicate before counts
and pagination; retain registrations in the global feed. Render the detail history only when it
has changes. Use localized registration/correction labels and omit initial batch reasons.
Verify populated-date omission, registration-only hiding, same-status corrections and actual
status changes with isolated PostgreSQL and public-data Chromium tests, then run repository gates.
No schema, production data or deployment changes are required. Evidence/privacy principles and
001 theme, locale, keyboard and fixture boundaries remain satisfied.

## Full date-field retirement — 2026-11-02

Remove the admin control/re-export, validators, import proposal field and public DTO key.
Use the existing db/migrations checksum runner with additive migration 007; preserve 001–006.
Replace save/publish/import functions as SECURITY INVOKER with existing grants, rehash evidence
without dates while preserving IDs, strip current JSON keys, then drop the column without CASCADE.
Guard date-only evidence/proposal collisions before mutations. Keep historical audit snapshots intact.
Test an actual 006→007 upgrade with dated records, deduplication, rollback on ambiguity, unchanged
review/history timestamps and existing non-owner RLS; verify admin import/edit/public browser flows.
Back up and migrate the local DB after isolated tests. Hosted removal must accompany compatible app
code in a release; do not break the running production admin by dropping its column ahead of code.

## Overall chart sort — 2026-11-02

Add migration 008 for published-only KR free/paid overall chart observations, with admin-only
writes and explicit source/collection times. Validate both complete 100-entry overall charts;
sync only registered identities atomically and reject stale replacements. Recreate chart observations
with their separate sync CLI; keep existing curated-content export and support snapshots/history untouched. Default URL sort is top-free; top-paid remains
explicit and existing sorts remain compatible. Join the selected chart before pagination in the
same stats/rows SQL statement. Before pagination, both chart sorts place all supported apps first,
then rank ascending within each group; unranked apps use deterministic name/slug order at each
group’s end. A catalog probe retains support priority with name order within groups before the
additive migration is installed. Show collection
date/source and contextual rank labels with existing Astryx controls/cards. Test SQL/URL ordering,
RLS, stale/incomplete imports, atomicity, fixtures without invented ranks and both locales/mobile.
