# 006 quickstart

Development: use existing .env.local and npm run dev. Hosted configuration is isolated in .env.hosted.production.local (0600); never copy it to a Next automatic env file.

```sh
npm run release:setup -- --target=production --project-ref=YOUR_PROJECT_REF
npm run release:export
npm run release:transfer-data -- --target=production --project-ref=YOUR_PROJECT_REF --source=.data/release/content-TIMESTAMP.json
npm run release:transfer-icons -- --target=production --project-ref=YOUR_PROJECT_REF --source=.data/release/content-TIMESTAMP.json
npm run release:check -- --target=production --project-ref=YOUR_PROJECT_REF
```

Transfer defaults to dry-run; only add --apply after reviewing the exact target. Existing content is already transferred, so unchanged replay is identical. For schema setup apply, obtain a direct/session connection; transaction pooler6543 cannot carry session advisory locks. No separate Preview project or variables are used. See docs/release.md for current deployment and publication gates.
