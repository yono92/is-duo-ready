# Implementation Plan: 004-app-import

**Branch**: main (existing shared checkout; previous agent completed) | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

## Summary
Bounded administrator-only Apple KR Lookup importer and RFC-style CSV parser with per-row outcomes, deduplicated draft writes and immutable reviewed support projections.

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
Implementation: src/lib/import/, src/app/[locale]/admin/apps/import/, src/messages/, scripts/probe-app-store.mjs, docs/import-validation.md, tests/unit/import.test.ts, tests/integration/import.test.ts, tests/e2e/admin.spec.ts.

## Dependencies and delivery

## Local icon storage implementation

Add migration 005 for RLS-protected public.app_icon_assets metadata; anon reads are restricted by
published directory entries and writes require an active administrator. Store original validated
PNG/JPEG/WebP bytes under .data/app-icons/<sha256>.<ext>, outside public/. A shared collector with
bounded HTTPS Apple-CDN requests and a local write/read adapter serves imports and a resumable
icons:sync command. Write the file before updating the pointer; retain prior metadata on failure.
Public/admin route handlers authorize every read and use no-store so archival and logout take effect.
Card/detail/admin views use same-origin image paths with generic fallback; no remote-image allowlist.
Validate malformed/oversized inputs, stale collection races, draft/public/archive RLS and browser
rendering with network independence. Supabase Storage remains a future persistence adapter.
002 → 003 → 004; each feature records tests independently, integrated importer→review→public checks close the combined scope. No feature is marked complete based only on another feature's tests.
