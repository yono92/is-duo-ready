# Data model

## Working entities (app_private)
- admin_users: user_id UUID primary key, enabled boolean; provisioned out of band, never editable by web users.
- apps: UUID id, app_store_id digits unique, slug lowercase letters/digits/hyphen unique, name 1..200 chars, developer 1..200, category nullable in draft, one of directory categories required for publication, aliases at most 50 strings each 1..100, original_locale ko/en, publication draft/published/archived, revision positive integer, created_at/updated_at UTC.
- app_translations: app_id+locale unique, name 1..200, summary at most 4000 chars, state current/needs-review. Source summary changes stale other translations.
- app_store_listings: app_id+country unique, country KR, HTTPS store URL on apps.apple.com with matching ID, nullable current_version <=100 and release_notes <=20000, last_fetch_success_at nullable UTC. Successful imports never set reviewed_at.
- app_support: app_id+country unique, status enum, summary <=4000, support_version nullable <=100, investigation_reason <=4000, reviewed_at nullable UTC. Explicit publication records review; unknown requires reason, other states require official evidence.
- sources: UUID, canonical HTTPS URL unique (no credentials, local/private hosts or fragments), title 1..500, kind app_store/developer/apple, official_confirmed boolean explicitly asserted by administrator.
- evidence: source_id, quote 1..4000, announced_at nullable date, support_version nullable, country KR; normalized content fingerprint prevents duplicates.
- app_evidence: app_id+evidence_id composite key; many-to-many.
- support_features: app_id+feature_key, description 1..1000, evidence_id linked to same app; only evidenced features publish.
- review_events: app_id, actor UUID, internal_note <=4000, action, UTC; private append-only audit.
- slug_redirects: old_slug unique, app_id; only resolves when a public entry is published. Old slugs cannot be reassigned to another app.

## Public projection
- directory_entries: app_id primary key, slug unique, publication published/archived, country KR, reviewed_at and support_changed_at UTC, snapshot jsonb containing only public fields (names, aliases, developer, category, status, summaries, versions, evidence, features, investigation reason). Snapshot cannot contain admin UUID/internal notes. Publication validates and constructs it from known columns, never stores client JSON verbatim.
- support_history: UUID, app_id, before/after public snapshots, change_reason 1..4000, changed_at UTC. No reviewer ID or private notes. Append-only; public reads require current published entry.

## Transitions
New → draft. Save/import changes working tables only. Publish/review → published projection + history atomically. Correction → new snapshot/history preserving old. Archive hides entry and history from public lookup. Re-publish revalidates current working data. Concurrent stale revision returns conflict. Publication failure rolls back every write.
