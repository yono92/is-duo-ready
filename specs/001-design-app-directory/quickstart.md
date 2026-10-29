# Quickstart validation

Prerequisite: Node.js 22.14+ and npm. No Supabase or Vercel account required.

```sh
npm ci
npm run dev
# open http://localhost:3000/ko or /en
npm run lint
npm run typecheck
npm test
npm run format:check
npx playwright install chromium
npm run test:e2e
npm run build
npm run test:production
# explicit LOCAL QA only; VERCEL always blocks fixtures:
LOCAL_FIXTURES=true npm start
```

Check Korean/English alias search, category+status intersection, empty/reset, next page and back.
The nine category labels follow official Apple names for a subset of categories; the URL slugs are internal.
Open ?category=creativity and confirm it resolves to graphics-design; newly generated URLs use the canonical slug.
Switch locale through the Globe menu on a filtered page and a detail page: query/slug, category and KR remain.
In a fresh browser context, change OS theme and confirm the page and the single light/dark switch follow it.
Activate that switch with keyboard and pointer, reload, and change OS theme again: the manual choice persists
and no longer follows OS. Its role and aria-checked reflect the current dark state; there is no system-choice UI.
At 360/768/1440px, check overflow and 1/2/3 columns. On desktop, inspect the shared 1120px content width,
168px category/status sidebar and search/card column alignment; on mobile inspect the centered stacked hero,
150px device area and readable Korean wrapping. Open filters, use keyboard and Escape, and confirm focus returns.
App summaries with missing/stale translation show a source notice. Inspect the AI-render/example-screen caption
in both themes; the local device render remains subject to public-use rights review.
Normal `npm start` without LOCAL_FIXTURES shows data unavailable; fixtures must never appear on Vercel.
See contracts/directory.md for boundary behavior. Evidence and dates remain absent for every fictional app.
