# Research decisions

Spec Kit research agent research_collection reviewed the existing adapters/roles and official references.

1. Decision: node:https with exact approved hostname, public IPv4 DNS validation and pinned lookup, agent:false, redirects rejected.
Rationale: URL syntax alone does not stop DNS rebinding. Keep original hostname for TLS/Host/SNI verification.
Alternative: generic fetch cannot pin DNS without an extra dispatcher dependency. IPv6-only sources fail closed initially.
Sources: https://nodejs.org/api/https.html ; https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
2. Decision: separate robots request, conservative path restrictions, manual terms confirmation, 8s abort and 2MiB bound, max 2 retries.
Rationale: robots is not rights permission. Any applicable disallow is conservatively blocked; unsupported rules may reduce coverage.
Alternative: browser scraping or redirects expand the attack surface and are outside MVP.
Source: https://www.rfc-editor.org/rfc/rfc9309.html
3. Decision: committed run with 5-minute lease, immutable observations and fingerprint unique across all decisions; no auto app mutation.
Rationale: interrupted workers recover without deleting previous observations; rejected content does not reappear.
Alternative: an HTTP request inside a long SQL transaction loses the attempt on process death.
4. Decision: non-Data-API ingress schema SECURITY DEFINER function with fixed empty search_path, explicit grants, global/hour and token/hour limits.
Rationale: preserve anon lack of private-table access; global cap cannot be bypassed by token rotation. No raw IP/contact.
Alternative: process-only limit fails across workers; trust arbitrary forwarded IP fails against spoofing.
Source: https://www.postgresql.org/docs/17/sql-createfunction.html
5. Decision: local CLI batch/watch; deployed Cron remains 006, only one scheduler enabled there.
Rationale: respects user's local-only environment choice and Preview isolation. No hosted credentials invented.
