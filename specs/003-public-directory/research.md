# Research and decisions

- Decision: explicit DIRECTORY_DATA_SOURCE=fixtures|postgres; if unset preserve fixture-only local UI behavior until database mode is deliberately selected. Fixtures never activate on hosted targets; DB errors do not fall back to fixtures.
- Decision: only public reviewed projection queries as anon, never admin database reads followed by client filtering. Keep a discriminated fictional/real DirectoryApp contract.
- Decision: PostgreSQL filtering by names/aliases, category/status, deterministic ordering and bounded page count; page size 24. Details are slug-addressable without loading every app.
- Decision: request-scoped read reuse plus Next cache invalidation after commit; private/admin reads are not shared cached. Both locale routes refresh on publish/archive.
- Decision: safe text rendering for source quotes; preserve original language fallback. App icons remain neutral placeholders until usage conditions are verified and recorded.
- Decision: SEO launch gated separately from data mode. Preview/local noindex; only published app URLs can enter production sitemap when PUBLIC_INDEXING is explicitly enabled for 006.

## Verified references (2026-10-29)
- Installed Next.js docs: node_modules/next/dist/docs/01-app/02-guides/server-actions.md, authentication.md; 03-api-reference/04-functions/cookies.md and revalidatePath.md. Async cookies, per-action auth, post-commit revalidation.
- https://nextjs.org/docs/app/api-reference/functions/revalidatePath : invalidate route paths after commit before redirect.
- https://www.postgresql.org/docs/17/ddl-rowsecurity.html : non-owner RLS tests, default deny, RLS does not hide columns.
- https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs : SSR cookies, verified identity. getSession user alone is not trusted.
- https://supabase.com/changelog : checked current changelog; October TLS cipher retirement is not a local SQL blocker. Markdown endpoint was unsupported by web tool and shell DNS restricted; HTML index was accessible.
- https://performance-partners.apple.com/search-api : KR parameter must be explicit, software lookup and API media use terms; no documented Duo support field assumed.

Hosted live Auth and production project configuration are not validated by local test identity or SQL tests. Final reporting must keep those 006 external checks explicit.
