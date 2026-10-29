# Quickstart

1. Existing local PostgreSQL and local admin from 002–004: npm run db:start; npm run db:migrate; npm run dev.
2. Add/import a draft app. In admin collections register its KR App Store URL, or a verified official web URL after terms check.
3. Run one target in UI or npm run collect. Inspect pending candidate; unchanged retries create no duplicate.
4. Compare with public/current draft, prepare evidence in app editor, return and approve. Verify both locale details and updates.
5. Submit an add/correction without login. Admin submissions shows it; import missing app, link matching ID, review explicitly.
6. npm run test:db; npm run test:admin; npm test; npm run test:e2e; npm run lint; npm run typecheck; npm run build.
7. Use temporary DB fixtures for failures, conflicts, rollback, denied hosts, and rate-limit scenarios. Never add fictional evidence to main DB.

Hosted Cron/Auth/TLS and deployment are not provisioned by this feature. Production readiness remains 006.
