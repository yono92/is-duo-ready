# Auto ads launch — 2026-11-02

The owner requested completing privacy disclosure, CMP URL, page exclusions and
production activation on the existing projects. No database or content changes.

## Implementation

The ko/en privacy pages describe verified locale/theme storage, submission fields,
the one-hour submission cookie and rate-limit cleanup, administrator authentication,
hosting and Google advertising. No private contact information or unverified
retention deadline was invented. The existing public GitHub contact channel is
linked with instructions not to post personal information.

When the production ad flag is enabled, internal page/query navigation uses a new
document. This isolates third-party ad DOM, timers and scripts from privacy,
administrator, submission, empty-result and initial error documents. Search and
filters preserve locale/query state and scroll to the directory heading. Hash,
external and modified/new-tab links retain their ordinary behavior. Local,
fixture and Preview navigation retain the existing client router.

## Local verification

- Lint PASS: zero errors, three existing ignored research-script warnings.
- Typecheck PASS; Webpack also checked the new test file types.
- Unit tests: 20 files / 97 tests PASS.
- Full Chromium E2E on port 3414: 35 PASS, one existing sorting scenario timed out
  at 30 seconds. The unchanged failed scenario passed alone with one worker
  (16.4s). This does not establish a fix for intermittent navigation timeouts.
- New ko/en privacy checks and fixture ad-traffic guards passed. Privacy links,
  360px overflow and absence of advertising/CMP tags were checked.
- Default Turbopack build failed with the existing CSS process/port EPERM.
- Webpack production build passed compile, TypeScript and page generation.
- Changed-file formatting and diff whitespace checks passed.

Logs: `/tmp/duoready-ads-launch-{lint,lint-final,typecheck,unit,unit-final,e2e,e2e-retry,build,webpack}.log`.

## Account configuration

Auto ads and auto optimization remain enabled. Eight section-prefix exclusions
were saved and the account list showed 8: ko/en admin, submit, privacy and
methodology. Other sites and their settings were left intact.

The existing message used the HTTP homepage as its privacy URL. Its replacement
with the real HTTPS policy is pending the policy release.

## Release status

Previous production/rollback target: `dpl_C87P4722Vm3CVwQDZWxb5KQzTvFB`.
At this preparation checkpoint no production ad flag, deployment or CMP URL has
been changed. Actual release results will be recorded after verification.
