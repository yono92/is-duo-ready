# AdSense crawl and consent diagnosis — 2026-11-02

The owner requested resolving remaining ads.txt discovery and consent-message
verification. Read-only public checks found HTTPS `/ads.txt` HTTP 200 with the
correct publisher record, and HTTP 308 redirected to the exact HTTPS file.
Production robots.txt kept general crawling disallowed while sharing crawlers
had an exception. No exact ads.txt or explicit advertising-bot rule was present.

This is a potential ads.txt discovery obstacle, not proof of the sole root cause.
Google documents that its advertising crawler can ignore a wildcard disallow;
we do not claim the wildcard definitively blocked all advertising verification.

## Change and local validation

Only actual production with the existing auto-ads opt-in gains a wildcard
`Allow: /ads.txt$` and explicit Mediapartners-Google / Google-Display-Ads-Bot public
content rules. General search content crawling, search noindex metadata and the
empty sitemap remain unchanged. Administrator/API exclusions and nonproduction,
fixture and disabled-ad boundaries remain enforced. No environment or DB change.

- Lint passed: zero errors and three pre-existing research-script warnings.
- Typecheck passed.
- Unit: 20 files / 98 tests passed, including the noindex advertising exception
  and enabled-ad opt-in with invalid environment boundaries.
- Full E2E: 36/36 passed on port 3416.
- Default Turbopack build failed at the existing CSS process/port EPERM.
- Webpack production build passed compile, TypeScript and page generation.
- Generated temporary test-port configuration was restored.

Logs are `/tmp/duoready-crawl-{lint,types,unit,e2e,build,webpack}.log`.
Deployment and account/consent diagnosis results will be appended after release.

## Official references

- [ads.txt crawl requirements](https://support.google.com/adsense/answer/7679060?hl=en)
- [Advertising and site-verification crawlers](https://support.google.com/adsense/answer/99376?hl=en)
- [Request an ads.txt status update](https://support.google.com/adsense/answer/12171612?hl=en)
- [Official consent-message test and integration](https://developers.google.com/funding-choices/fc-api-docs)
