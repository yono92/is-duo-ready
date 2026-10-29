# Data model

- collection_targets: id, app_id FK, kind app_store/web, HTTPS url <=2000, exact approved_host, approval_note 1..1000,
  enabled, interval_hours 24..168, next_due_at, lease_token/expires, last_success_at, failures >=0, last_error. Unique app+URL.
- collection_runs: id, target FK, token, state running/succeeded/failed/abandoned, attempts 0..3, error <=50, started/finished.
- collection_observations: id, target FK, fingerprint SHA256, payload object <=150000 bytes, observed_at; unique target+fingerprint.
  First observation also candidate; API excludes fetched_at from hash; all older versions/notes preserved.
- review_items: id, nullable app FK, target/observation or submission link, before_payload, candidate_payload <=150000 bytes,
  state pending/deferred/approved/rejected, revision positive, reason <=4000, decided_by/time. One item per observation/submission.
  pending/deferred -> deferred/rejected/approved; terminal cannot transition. Link app only before terminal; version increments.
- submissions: id, kind add/correction, app_store_id, store_url <=2000, body 10..4000, evidence_url <=2000,
  fingerprint unique, created_at; no email/IP. Review state lives in review_items.
- submission_limits: global + visitor-hash hourly buckets, counter; old buckets purged on intake.

All operational tables RLS admin only. Append-only observations, submissions and completed run records in application workflow.
Ingress function accepts only fixed fields, checks lengths/type, locks one global limiter, charges every valid request,
allows 5 per visitor/hour and 60 total/hour, deduplicates content, returns no private identity/content.
Approval locks review row, checks review/app revisions, invokes publish_app and finally marks approved in one transaction.
Failure of any step rolls back public snapshot, support history, audit and queue state.
