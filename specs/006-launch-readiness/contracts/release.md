# 006 release contracts

- Hosted commands require explicit target/ref matching dedicated config; never fall back to
  local .env.local. Transfer defaults to read-only; migrations require explicit apply.
- Content transfer uses stable source snapshot, fixed table allowlist, no local authorization,
  dependency order, empty destination or identical rerun and transactional comparisons.
- Icon transfer verifies original and target hashes; private bucket only, no source deletion.
- Runtime routes retain existing URLs/access checks. No bucket URL/secret is passed to browser.
- Release check exits nonzero for incomplete content/environment/rights. Local tests are not
  hosted proof. Account quota/permission/credential blockers remain recorded.
- Hosted artifact excludes development assets, .data, .env and tests; local auth stays disabled.
