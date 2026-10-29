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
