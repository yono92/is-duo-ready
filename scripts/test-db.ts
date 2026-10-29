import { randomUUID, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import {
  localDatabaseUrl,
  databaseClient,
  bootstrapLocalRoles,
  applyMigrations,
} from './lib/database.ts';

// Generated database names are never taken from user input or a production URL.
const name = `duo_test_${randomUUID().replaceAll('-', '')}`;
const e2e = process.argv.includes('--e2e');
const production = process.argv.includes('--production');
let maintenance;
let testClient;
let created = false;
try {
  const url = new URL(localDatabaseUrl());
  maintenance = databaseClient(url.toString());
  await maintenance.connect();
  await bootstrapLocalRoles(maintenance);
  await maintenance.query(`CREATE DATABASE ${name}`);
  created = true;
  url.pathname = `/${name}`;
  testClient = databaseClient(url.toString());
  await testClient.connect();
  await applyMigrations(testClient);
  const repeated = await applyMigrations(testClient);
  if (repeated.length) throw new Error('Migration replay was not idempotent.');
  const actor = randomUUID();
  if (e2e)
    await testClient.query('INSERT INTO app_private.admin_users(user_id) VALUES($1)', [actor]);
  await testClient.end();
  testClient = null;
  const files = (await readdir('tests/integration'))
    .filter((file) => file.endsWith('.test.ts'))
    .sort()
    .map((file) => `tests/integration/${file}`);
  if (!files.length) throw new Error('No integration tests were found.');
  const args = e2e
    ? [
        'node_modules/@playwright/test/cli.js',
        'test',
        '--config=playwright.admin.config.ts',
        ...process.argv.slice(2).filter((arg) => arg !== '--e2e'),
      ]
    : production
      ? ['scripts/verify-db-production.ts']
      : ['--test', '--test-concurrency=1', ...files];
  const child = spawn(process.execPath, ['--import', 'tsx', ...args], {
    env: {
      ...process.env,
      DUO_TEST_DATABASE_URL: url.toString(),
      ...(e2e
        ? {
            DATABASE_URL: url.toString(),
            DUO_TEST_RUN: '1',
            // Next re-executes itself; use Node 22 native stripping for its test-only preload.
            // A global tsx loader stalls Next dev startup; CLI/tests still use tsx explicitly.
            NODE_OPTIONS:
              `${process.env.NODE_OPTIONS ?? ''} --experimental-strip-types --import=${new URL('../tests/fixtures/apple-fetch.ts', import.meta.url).href}`.trim(),
            DIRECTORY_DATA_SOURCE: 'postgres',
            LOCAL_ADMIN_AUTH: 'true',
            LOCAL_ADMIN_USER_ID: actor,
            LOCAL_ADMIN_EMAIL: 'admin@example.invalid',
            LOCAL_ADMIN_PASSWORD: randomBytes(24).toString('base64url'),
            NEXT_PUBLIC_SUPABASE_URL: '',
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
          }
        : {}),
    },
    stdio: 'inherit',
  });
  const code = await new Promise<number>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (status) => resolve(status ?? 1));
  });
  process.exitCode = code;
} catch (error) {
  console.error('Isolated database verification failed; application data was not reset.');
  if (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Z0-9]{5}$/.test(error.code)
  )
    console.error(`SQLSTATE ${error.code}`);
  process.exitCode = 1;
} finally {
  await testClient?.end().catch(() => {});
  if (created && maintenance) {
    try {
      await maintenance.query(`DROP DATABASE ${name} WITH (FORCE)`);
    } catch {
      console.error(`Temporary test database cleanup failed: ${name}`);
      process.exitCode = 1;
    }
  }
  await maintenance?.end().catch(() => {});
}
