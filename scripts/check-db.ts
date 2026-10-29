import nextEnv from '@next/env';
import { Client } from 'pg';
import { validateEnvironment } from './lib/environment.ts';

try {
  let loadFailed = false;
  nextEnv.loadEnvConfig(process.cwd(), true, {
    info() {},
    error() {
      loadFailed = true;
    },
  });
  if (loadFailed) throw new Error('Unable to load local environment files.');
  const result = validateEnvironment(process.env, 'local');
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  if (result.mode === 'ui-only') {
    throw new Error('Local PostgreSQL is not configured. Run npm run db:start and npm run db:env.');
  }

  let client;
  try {
    client = new Client({
      connectionString: process.env.DATABASE_URL!.trim(),
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
      statement_timeout: 5000,
      application_name: 'duo-ready-db-check',
      options: '-c default_transaction_read_only=on',
    });
    // Handle idle disconnections without printing driver errors or connection credentials.
    client.on('error', () => {});
    await client.connect();
    const { rows } = await client.query(
      "SELECT current_database() AS database, current_setting('server_version') AS server_version, 1 AS connection_check",
    );
    if (rows.length !== 1 || rows[0].connection_check !== 1) {
      throw new Error('Unexpected database check result.');
    }
    console.log('PASS PostgreSQL connection: SELECT 1');
    console.log(`Database: ${rows[0].database}`);
    console.log(`PostgreSQL version: ${rows[0].server_version}`);
  } catch {
    throw new Error(
      'Local PostgreSQL connection check failed. Check npm run db:status and DATABASE_URL; connection credentials are not shown.',
    );
  } finally {
    await client?.end().catch(() => {});
  }
  console.log(
    'Local database connectivity verified. Use test:db and test:admin for application schema, RLS and workflow verification.',
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Local connection check failed.');
  process.exitCode = 1;
}
