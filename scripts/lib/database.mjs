import nextEnv from '@next/env';
import { Client } from 'pg';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './environment.mjs';
import { connectionOptions } from '../../src/lib/db/connection.mjs';

export function localDatabaseUrl() {
  let failed = false;
  nextEnv.loadEnvConfig(process.cwd(), true, {
    info() {},
    error() {
      failed = true;
    },
  });
  const result = validateEnvironment(process.env, 'local');
  if (failed || result.errors.length || result.mode !== 'postgres-configured') {
    throw new Error('A valid local PostgreSQL environment is required. Run npm run env:check.');
  }
  return process.env.DATABASE_URL.trim();
}

export function databaseClient(connectionString) {
  const client = new Client({
    ...connectionOptions(connectionString),
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
    application_name: 'duo-ready-migrations',
  });
  client.on('error', () => {});
  return client;
}

// Only the local bootstrap creates missing Supabase-compatible roles. Hosted roles
// already exist; application migrations never alter their attributes or passwords.
export async function bootstrapLocalRoles(client) {
  for (const role of ['anon', 'authenticated']) {
    const { rows } = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role]);
    if (!rows.length) await client.query(`CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    const result = await client.query(
      'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = $1',
      [role],
    );
    if (result.rows[0].rolsuper || result.rows[0].rolbypassrls) {
      throw new Error('Application roles must not bypass row security.');
    }
  }
}

export async function applyMigrations(client, migrationDirectory) {
  const directory =
    migrationDirectory ?? fileURLToPath(new URL('../../db/migrations/', import.meta.url));
  const files = (await readdir(directory))
    .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  const applied = [];
  await client.query("SELECT pg_advisory_lock(hashtext('duo-ready-migrations'))");
  try {
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS duo_migrations;
      REVOKE ALL ON SCHEMA duo_migrations FROM PUBLIC;
      CREATE TABLE IF NOT EXISTS duo_migrations.history (
        name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    const history = await client.query('SELECT name, checksum FROM duo_migrations.history');
    const known = new Map(history.rows.map((row) => [row.name, row.checksum]));
    if (history.rows.some((row) => !files.includes(row.name))) {
      throw new Error('An applied migration is missing from the repository.');
    }
    // Validate the entire history before applying anything new.
    const sources = await Promise.all(
      files.map(async (name) => {
        const sql = await readFile(`${directory}/${name}`, 'utf8');
        const checksum = createHash('sha256').update(sql).digest('hex');
        if (known.has(name) && known.get(name) !== checksum) {
          throw new Error('An applied migration changed. Add a new migration instead.');
        }
        return { name, sql, checksum };
      }),
    );
    for (const { name, sql, checksum } of sources) {
      if (known.has(name)) continue;
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO duo_migrations.history (name, checksum) VALUES ($1, $2)', [
          name,
          checksum,
        ]);
        await client.query('COMMIT');
        applied.push(name);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('duo-ready-migrations'))");
  }
  return applied;
}
