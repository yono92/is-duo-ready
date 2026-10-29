# Is Duo Ready? — repository instructions

- Product source of truth: docs/PRD.md. Service name: Is Duo Ready?; package/project id: duo-ready.
- UI work must follow DESIGN.md: Apple-inspired visual tokens with Notion-style directory structure.
- Read docs/engineering-principles.md and active specs/001-design-app-directory before changes.
- Optional local Spec Kit/agent tooling is excluded from Git; product specifications remain in specs/.
- Stack: Next.js App Router, strict TypeScript, Astryx, Tailwind 4, Supabase; future target Vercel.
- Check installed Next.js docs in node_modules/next/dist/docs and official docs for changed APIs.
- Locale ko/en and store country KR are independent. All user-facing text belongs in messages.
- Never invent app support evidence or review timestamps. Fictional fixtures are local-only; preserve production gate.
- Preserve keyboard accessibility, themes, mobile layouts, URL state, source translation fallback.
- Official imagery needs verified rights. Record assets in docs/assets.md.
- Never expose service-role/secret keys. Future DB changes require migrations and RLS.
- Do not create external projects or deploy as part of 001.
- Validate with npm run lint, npm run typecheck, npm test, npm run test:e2e, npm run build.
- Record verification honestly in docs/verification.md; keep tasks.md aligned with completed work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
