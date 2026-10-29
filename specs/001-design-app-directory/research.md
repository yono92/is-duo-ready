# Research — 001

Checked 2026-10-29. Installed CLI and official primary sources were inspected before implementation.

## Spec Kit / Codex
- Decision: installed specify-cli 1.0.13; `specify init --here --force --non-interactive --integration codex --integration-options="--skills"`.
- Rationale: CLI help and installed `specify_cli/integrations/codex/__init__.py` agree: skills default true, commands deprecated.
- Result: `.agents/skills/speckit-*`, bundled `.specify` templates/scripts; no network needed for init.
- Workflow: `$speckit-constitution`, `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, `$speckit-implement`, optional `$speckit-analyze`/`$speckit-converge`.
- Alternative rejected: legacy `.codex/prompts` and guessed slash commands.
- Source: https://github.com/github/spec-kit/blob/v1.0.13/src/specify_cli/integrations/codex/__init__.py
- No AGENTS.md or Git repository existed. Supplied docs/duo-ready-PRD.md was moved unchanged to docs/PRD.md as its own section 14 requests.

## Localization
- Decision: next-intl 4.14.9, always-prefixed /ko and /en, default en, one-year DUO_LOCALE cookie.
- Rationale: URL > cookie > Accept-Language > en; createNavigation preserves locale-aware links; explicit query preservation on language switch.
- Alternative: manual dictionary/proxy would duplicate negotiation and ICU formatting.
- Sources: https://next-intl.dev/docs/routing/configuration ; https://next-intl.dev/docs/routing/middleware ; https://next-intl.dev/docs/routing/navigation
- Server request config loads locale dictionary. Country KR is separate and never derived from locale.

## Theme / UI
- Decision: next-themes class strategy, initial system default, mounted single light/dark role=switch, suppressHydrationWarning on html only.
- Rationale: pre-paint script and persisted preference prevent theme flash. Without a manual preference, OS changes update the resolved theme and switch state. Manual light/dark selection persists and stops following OS; there is no explicit system selection UI. aria-checked reports the resolved dark state.
- Source: https://github.com/pacocoursey/next-themes
- Decision: shadcn/ui Radix Sheet and controls, Tailwind semantic tokens, restrained neutral cards.
- Sources: https://ui.shadcn.com/docs/installation/next ; https://www.notion.com/connections
- Alternative rejected: dashboard metrics, large screenshots per card, unlicensed official assets.

## Framework / data boundary
- Decision: Next.js 16.4.3 from npm registry, App Router async params/searchParams and proxy.ts.
- Sources: https://nextjs.org/docs/app/getting-started/installation ; https://nextjs.org/docs/app/guides/internationalization
- Decision: exact pinned Supabase JS client, server-only helper with publishable key; schema/auth/reads deferred to 002/003.
- Source: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Changelog checked: https://supabase.com/changelog.md ; upcoming 2026-11-10 old TLS 1.2 cipher removal does not affect modern Node/browser targets.
- Alternative rejected: creating remote project or pretending fixture-backed data is live Supabase.

## Fixture exposure
- Decision: allow in NODE_ENV development/test, or explicit LOCAL_FIXTURES=true for local production QA only;
  VERCEL presence always blocks fixture regardless of override. Production defaults to unavailable view.
- Rationale: build and local production browser QA possible, no accidental Vercel fixture publication.
- No fixture routes in sitemap; robots and all 001 metadata noindex. Real SEO indexing enabled only with reviewed data in 003/006.

## User-selected visual reference — 2026-10-29
- Decision: adopt https://getdesign.md/apple/design-md for visual language; keep Notion Connections for directory structure.
- Source: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md ; source is an independent analysis, not Apple documentation.
- Snapshot: docs/references/apple-design-analysis.md; upstream MIT license verified and preserved alongside it. Project-specific rules live in DESIGN.md.
- Rationale: neutral white/parchment/ink surfaces, one Action Blue interaction color, system typography, pill actions/search and flat utility cards match the user's preference.
- Adaptations: preserve 1/2/3-column directory, semantic support colors, source asset policy and first-screen search/card visibility. Full-viewport product tiles would obstruct the PRD's primary discovery flow.
- Source gaps: dark store/accessory cards are not fully specified; this app supplies dark tokens with contrast verification. Font files and official product imagery are not imported.
- Alternatives rejected: replacing the directory with a marketing storefront; copying product imagery or downloading SF Pro; retaining the earlier green interaction palette.
- Implementation adaptation: black compact header retains existing nav links. Its Globe-only dropdown shows Korean/English labels only when opened; one accessible switch selects light/dark. The first visit follows OS automatically, while a saved manual selection ignores later OS changes. Locale persistence and URL context remain unchanged. White hero and parchment directory switch to black/#161617/#272729 in dark mode. Dark link blue (#2997ff) is separate from filled CTA blue (#0066cc) to preserve white-text contrast.
- Density adaptation after user review: use a common maximum width of 1120px, a 42px desktop hero and a 1.15:0.85 copy/device grid. Mobile uses a centered stacked 28–30px heading and 150px device area. Group category/status controls in the left 168px sidebar and align search/sort with the right card column, followed by a compact results row. Keep 17px reading text but use 14px two-line card summaries, horizontal icon/name headers, support/category row and review footer. Cards use 18px corners and 20px padding/gaps. Korean headings retain keep-all wrapping.
- Branding: replace the CSS two-line mark with an original blue rounded-square dual-panel/check SVG at public/brand/duo-mark.svg and the same drawing at src/app/icon.svg. No Apple logo or remote brand assets are used. The original device SVG remains available as fallback; the active local prototype uses the newly generated reference-informed AI device render with localized AI-render/example-screen captions. Inspected official photos are not bundled. Generated imagery does not clear public-use rights; provenance and remaining review are recorded in docs/assets.md.

## Official App Store category names — 2026-10-29
- Decision: use the nine official Apple category names required by the current fictional directory: productivity, graphics-design, music, books, travel, navigation, photo-video, entertainment, lifestyle.
- Sources and bilingual names: docs/references/app-store-categories.md; https://developer.apple.com/kr/app-store/categories/ ; https://developer.apple.com/app-store/categories/ .
- Rationale: the service covers iPhone apps in the KR store, so the earlier custom creativity label is replaced by Graphics & Design / 그래픽 및 디자인. This is a subset of category names, not the complete taxonomy or Apple API identifiers; URL slugs belong to this project.
- Compatibility: accept legacy category=creativity as graphics-design and serialize the canonical slug. Language switching preserves category and KR.
- Data boundary: fictional categories are explicit UI examples. Future real data must preserve the store's primary genre identifier/name and use a verified mapping. No category change creates support evidence or review timestamps.

## Astryx migration — 2026-10-29
- Decision: user requested replacing shadcn/ui. Pin core/theme-neutral 0.7.4 and the StyleX peer runtime; use precompiled CSS with no compiler plugin or remote fonts. This supersedes the original shadcn/Radix decision above.
- Sources: https://astryx.atmeta.com/docs/styling-overview ; https://astryx.atmeta.com/docs/theme ; https://astryx.atmeta.com/docs/migration ; installed package types and implementation.
- Native inputs inside Astryx Field retain search/url/date/file types, controlled and uncontrolled values, browser validation, reset and FormData. Astryx TextInput only types text/email/password and requires a controlled value, so forcing all current forms through it would change behavior.
- Astryx Dialog implements the mobile side panel; DropdownMenu radio group implements language selection. Keep native selects and the existing custom theme switch.
- Preserve next-themes storage. Render the same system mode on server and initial client, then apply the stored manual mode after hydration. The html theme class and inherited color-scheme keep saved colors authoritative before hydration.
- Static semantic token overrides preserve Apple-inspired styling in ordinary and portal content. Package defaults stay below product styles and Tailwind utilities.
- Remove radix-ui, class-variance-authority and components.json. No routing, data policy, authentication or deployment changes.
