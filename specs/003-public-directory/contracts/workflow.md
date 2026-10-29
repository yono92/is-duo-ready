# Interface contract

GET /[locale]?q=&category=&status=&sort=&page= preserves existing query normalization and URL semantics. Unknown categories normalize safely; invalid pages clamp to available results. Errors render a localized retry state, genuine zero rows render empty results, configuration absence renders unavailable.
GET /[locale]/apps/[slug] returns only a published app, explicit versions/evidence/features/history, KR label and language fallback. Draft/archive/not-found use 404; DB failure uses error boundary. Old slug redirects preserve locale and query.
GET /[locale]/updates paginates public support history by change timestamp; store metadata imports alone never appear.
Publication invalidates both locale home/detail/updates routes plus sitemap. No private payload or source translation draft appears in HTML/RSC/metadata. Methodology and submit links retain their current scope (actual submission in 005).
