# Workflow contracts

- GET /{locale}/submit?app=<published slug>: prefill KR URL using published data only. Invalid/private slug not revealed.
- submitAction: validated kind, canonical KR store URL, 10..4000 content, HTTPS source URL, honeypot blank;
  server-generated opaque visitor cookie -> hash; returns received/rateLimited/invalid/unavailable only. No external fetch.
- /admin/collections: admin register target for existing app, explicitly confirm official source and terms; exact URL hostname approved;
  enable/pause and request one due/retry target. Last success, consecutive failures, recent attempts visible.
- /admin/reviews and /admin/submissions: filters by state, pages of 30; detail compares published snapshot, previous observation,
  candidate text/source, and current saved draft; links to existing app editor. No raw HTML rendering.
- review action: verified admin + review revision + app revision + required reason + explicit confirmation for approve;
  approve publishes saved draft atomically, defer/reject preserve public data. Source candidates never auto overwrite draft/evidence.
- link submission: target app must have matching App Store ID. New app prepared through existing import/editor first.
- CLI npm run collect [-- --watch]: local-only validated DB + enabled configured local admin, one <=5-target batch;
  watch repeats every minute and due dates default daily. Ctrl-C stops. Reject hosted/Preview/production execution.
- Collection worker: claim and persist before network; one active global collection lease, expire interrupted lease after 5min;
  each attempt counted before request; global Apple import/collection pacing uses existing advisory lock/clock.
- Errors are finite codes, never connection strings, private request bodies or arbitrary upstream content.
