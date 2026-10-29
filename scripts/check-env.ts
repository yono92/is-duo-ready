import nextEnv from '@next/env';
import { validateEnvironment } from './lib/environment.ts';

const { loadEnvConfig } = nextEnv;

const args = process.argv.slice(2);
if (
  args.length > 1 ||
  (args.length === 1 && !/^--target=(local|preview|production)$/.test(args[0]))
) {
  console.error('target: expected --target=local, --target=preview, or --target=production.');
  process.exitCode = 1;
} else {
  const requestedTarget = args[0]?.slice('--target='.length);
  const loadingTarget = requestedTarget ?? process.env.VERCEL_ENV ?? 'local';
  let loadFailed = false;
  // Match Next.js precedence: existing process env, mode-specific local, .env.local,
  // mode-specific, then .env. Suppress raw loader errors, which may contain values.
  try {
    loadEnvConfig(process.cwd(), loadingTarget === 'local', {
      info() {},
      error() {
        loadFailed = true;
      },
    });
  } catch {
    loadFailed = true;
  }
  if (loadFailed) {
    console.error('Environment files: unable to load configuration; values were not logged.');
    process.exitCode = 1;
  } else {
    const result = validateEnvironment(process.env, requestedTarget);
    if (result.errors.length) {
      for (const error of result.errors) console.error(`FAIL ${error}`);
      process.exitCode = 1;
    } else {
      console.log(`PASS ${result.target}: ${result.mode} environment string contract.`);
      console.log(
        'No network request was made. Project identity, credentials, and permissions remain unverified.',
      );
    }
  }
}
