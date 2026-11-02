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


## Production release

Source `8f21e8a` was archived into an isolated temporary directory with only the
existing `.vercel/project.json` link. Dirty workspace files, local credentials,
`.data`, environment files and output were excluded from the upload.
The remote default build passed. Deployment `dpl_9rAemkmHAXanuMRgFw6W4xT7cQJC`
(`https://is-duo-ready-g259tp4tt-yonos-projects-8566d4cb.vercel.app`) was checked
before promotion to the existing public domain.

Authenticated stage responses confirmed exact ads.txt access and explicit
advertising bot rules, private path exclusions, no robots sitemap declaration,
correct publisher loader and home `noindex, nofollow`. After promotion, public
robots.txt and ads.txt returned HTTP 200 with the expected contents; public
sitemap.xml remained empty. No environment setting was changed.

## Native private-browser diagnosis

A new Whale private window, created only for this test, loaded the official
`/en?fc=alwaysshow&fctype=gdpr` URL. DevTools Network recorded 71 requests:
`adsbygoogle.js?client=ca-pub-8224851078290204` returned 200, but the Funding Choices
filter matched 0 requests. The Google `pagead/ads` request returned 200 with only:

```html
<html>
    <body style="background-color:transparent"></body>
</html>
```

This proves SDK delivery and an empty Google response in this test; it does not
prove real ad fill or identify the provider-side eligibility/configuration cause.
Console showed two warnings (unsupported data-nscript attribute and existing
Three.Clock deprecation), with no displayed JavaScript/CSP error. The application
source/config search found no custom googlefc controlledMessaging suppression or
script-src policy. We did not add an undocumented direct CMP bootstrap or extra ad
request workaround. No ad was clicked. The test-only private window was closed.

After release the account was refreshed. It still showed Preparing / under review /
review requested and ads.txt Not found, displayed last update 2026-10-30 09:04 KST. The
current site details/ads.txt snippet view did not offer Check for updates, Verify
or an equivalent submit action; no recrawl request is claimed. The account's
ads.txt snippet exactly matched the public file. A new review was not requested.


The published message was reopened read-only. The message list still showed
Published with the actual modification date 2026-11-02; its site-selection dialog
showed is-duo-ready.vercel.app selected and the persisted policy URL exactly
`https://is-duo-ready.vercel.app/en/privacy`. English and 31 additional languages,
Consent / Do not consent / Manage options were present. No message setting or
other site's configuration was changed during this follow-up.

Remaining external work: wait for the Google crawl/review result, use Check for
updates if the account exposes it, and repeat actual CMP consent/refusal/revocation
and creative-fill checks. The precise reason Google did not bootstrap a message
is unresolved. Approval is not assumed to fix this automatically. These findings
form a reproducible diagnostic record if provider support is needed; no message
was sent to Google or any other person.
