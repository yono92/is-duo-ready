# 006 implementation plan — final scope

## Architecture
Local development uses the existing loopback PostgreSQL and .data/app-icons. One hosted Supabase project and Vercel Production serve the operational target. Both project names are is-duo-ready; service display remains Is Duo Ready?. Reuse ref YOUR_PROJECT_REF and Vercel ID YOUR_VERCEL_PROJECT_ID. No separate Preview DB or app deployment.

## Configuration and access
Use .env.hosted.production.local (0600), never .env.production.local that Next could load during local builds. Runtime uses postgres mode, private Storage, verified Supabase sessions and request-scoped anon/authenticated roles with RLS. Admin membership and auth.sessions are checked per request. Enforce SSL and verify the official CA/hostname. Vercel Production holds server secrets; Preview has no app configuration and fails the hosted guard.

## Content and imagery
Retain original icon bytes under content-hash keys in a private size-limited bucket. Fixed allowlist content snapshot/transfer excludes local auth/admin grants, submissions and worker state; default dry-run, empty-or-identical target, transaction rollback and post-copy hashes. Never publish or add review dates during transfer. Exclude development render from hosted UI, routes and upload.

## Delivery and verification
Local lint/typecheck/unit/isolated DB/admin+public E2E/build/production guards precede actual application deployment. Provider session/role/storage/TLS checks are recorded separately from deployed browser tests. The user approved only a static initial Production bootstrap to overcome Vercel first-deployment routing; it contains no app or DB connection. Local+Production correction supersedes the initial 3-environment plan. Record all incomplete gates honestly in docs/release.md and docs/verification.md.

## 공유 미리보기·SEO 계획
1. `src/messages/seo.ts`에 ko/en SEO 설정을 모으고 기존 Metadata namespace를 대체한다. 순수 metadata helper는 제목·설명·절대 URL·OG/Twitter 및 색인 경계를 일관되게 만든다.
2. `/api/og/[locale]`에서 자체 브랜드 도형과 로컬 OFL 글꼴로 PNG를 제공한다. Next metadata streaming을 끄고 최초 head에 태그를 제공한다. 이는 metadata 조회 완료까지 head를 기다리는 tradeoff다.
3. 모든 공개 페이지를 helper에 연결하고 사이트맵 언어 대체 경로 및 소셜 봇 robots 정책을 정리한다. 홈 WebSite JSON-LD는 실제 서비스 이름·URL·언어만 표현한다.
4. 순수 함수 단위 검사와 raw HTML/PNG 브라우저 회귀 검사를 추가한다. lint/typecheck/unit/E2E/build 결과, 이미지 출처와 관리 방법을 기록한다.
