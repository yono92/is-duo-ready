# Implementation Plan: 005 변경 수집·검토·제보

**Branch**: main (local) | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

## Summary
기존 앱 편집·공개 함수에 검토 항목 완료를 같은 트랜잭션으로 결합한다. 일 단위 감시 대상을
한 건씩 lease로 확보해 HTTP 밖에서 실행 기록을 남기고 관측/후보를 원자적으로 저장한다.
웹은 공식 호스트 확인·DNS IP 고정·robots·크기/시간 제한을 적용한다. 비회원 접수는
비노출 ingress 스키마 함수로 검증·원자적 제한·비공개 후보 생성만 허용한다.

## Technical Context
**Language/Version**: Node 22, strict TypeScript, PostgreSQL 17
**Primary Dependencies**: existing Next 16 App Router, next-intl, pg; node:https/dns/crypto
**Storage**: additive migration 004; applied 001–003 unchanged
**Testing**: Vitest, node:test real temporary PG, Playwright + axe; critical flow repeated 5 times
**Target Platform**: local Next/PG now, Supabase/Vercel setup in 006
**Project Type**: existing single web app plus bounded CLI worker
**Performance Goals**: one target per UI request; CLI maximum five per batch; 8s/request, <=2 retries
**Constraints**: HTTPS exact host allowlist, public IPv4 only, redirects denied, 2MiB body max; no HTML execution
**Scale/Scope**: ko/en, 2 themes, 3 widths, daily targets, local worker only; no deployment

## Constitution Check
Before research: PASS — no automatic support claims; private operational data; additive migrations.
After design: PASS — public publish validation reused, all queue decisions transactional; raw IP/contact not collected;
no public read of submissions; source text escaped; fixtures only isolated test DB; external rollout deferred explicitly.

## Project Structure
- db/migrations/004_collection_review.sql — monitors/runs/observations/queue/submissions/ingress
- src/lib/collection/{web,worker}.mjs — bounded source adapters and durable shared worker
- src/lib/operations/ — validated input, server-only reads/actions
- src/app/[locale]/admin/(protected)/{collections,reviews,submissions}/ — admin routes
- src/app/[locale]/submit/ — anonymous submission
- src/components/operations/ — accessible localized forms/comparison
- scripts/collect.mjs — local single batch/watch entrypoint
- tests/{unit,integration,e2e}/ — security, transactional workflow, UI verification

## Complexity Tracking
No constitutional exceptions. One narrow SECURITY DEFINER ingress is needed because anon has no private-schema access;
it grants no table read or direct insert and enforces a global cap even if the caller rotates its visitor token.
