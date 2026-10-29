import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../scripts/lib/environment.mjs';

const publishable = 'sb_publishable_example_local_test_only';
const jwt = (role: string) =>
  `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.test_signature`;
const local = {
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:55322/duo_ready',
};
const hosted = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://previewproject.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  NEXT_PUBLIC_SITE_URL: 'https://preview.example.com',
  SUPABASE_PRODUCTION_PROJECT_REF: 'productionproject',
  DIRECTORY_DATA_SOURCE: 'postgres',
  DATABASE_URL:
    'postgresql://postgres:example@db.previewproject.supabase.co:5432/postgres?sslmode=verify-full',
  ICON_STORAGE_PROVIDER: 'supabase',
  SUPABASE_STORAGE_BUCKET: 'app-icons',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
};

describe('environment string contract', () => {
  it('allows only an explicitly identified Preview before Production provisioning', () => {
    const preview = {
      ...hosted,
      SUPABASE_PRODUCTION_PROJECT_REF: '',
      SUPABASE_PREVIEW_PROJECT_REF: 'previewproject',
    };
    expect(validateEnvironment(preview, 'preview').errors).toEqual([]);
    expect(validateEnvironment(preview, 'production').errors.length).toBeGreaterThan(0);
    expect(
      validateEnvironment({ ...preview, SUPABASE_PREVIEW_PROJECT_REF: 'wrong' }, 'preview').errors
        .length,
    ).toBeGreaterThan(0);
  });
  it('rejects hosted fixtures and missing persistent storage without exposing secrets', () => {
    for (const change of [
      { DIRECTORY_DATA_SOURCE: 'fixtures' },
      { DATABASE_URL: '' },
      { ICON_STORAGE_PROVIDER: 'local' },
      { SUPABASE_STORAGE_BUCKET: '' },
      { SUPABASE_SECRET_KEY: '' },
      { SUPABASE_SECRET_KEY: publishable },
    ]) {
      const result = validateEnvironment({ ...hosted, ...change }, 'preview');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(result)).not.toContain(hosted.SUPABASE_SECRET_KEY);
    }
  });
  it('requires an explicit database for DB mode and separates hosted Auth and SQL projects', () => {
    expect(validateEnvironment({ DIRECTORY_DATA_SOURCE: 'postgres' }).errors).not.toEqual([]);
    expect(validateEnvironment({ DIRECTORY_DATA_SOURCE: 'invalid' }).errors).not.toEqual([]);
    const database =
      'postgresql://postgres:example@db.previewproject.supabase.co:5432/postgres?sslmode=verify-full';
    expect(
      validateEnvironment(
        { ...hosted, DIRECTORY_DATA_SOURCE: 'postgres', DATABASE_URL: database },
        'preview',
      ).errors,
    ).toEqual([]);
    expect(
      validateEnvironment(
        {
          ...hosted,
          DIRECTORY_DATA_SOURCE: 'postgres',
          DATABASE_URL:
            'postgresql://postgres.previewproject:example@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=verify-full',
        },
        'preview',
      ).errors,
    ).toEqual([]);
    for (const value of [
      database.replace('previewproject', 'productionproject'),
      database.replace('verify-full', 'disable'),
      database + '&host=other.example.com',
      local.DATABASE_URL,
    ]) {
      const result = validateEnvironment(
        { ...hosted, DIRECTORY_DATA_SOURCE: 'postgres', DATABASE_URL: value },
        'preview',
      );
      expect(result.errors).not.toEqual([]);
      expect(JSON.stringify(result)).not.toContain(value);
    }
    expect(
      validateEnvironment({ ...hosted, LOCAL_ADMIN_AUTH: 'true' }, 'preview').errors,
    ).not.toEqual([]);
  });
  it('allows UI-only local development and rejects local Supabase API configuration', () => {
    expect(validateEnvironment({})).toMatchObject({ target: 'local', mode: 'ui-only', errors: [] });
    expect(validateEnvironment(local)).toMatchObject({ mode: 'postgres-configured', errors: [] });
    for (const configuration of [
      { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' },
      { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable },
      {
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
      },
    ]) {
      expect(validateEnvironment({ ...local, ...configuration }).errors).toContain(
        'Local PostgreSQL uses DATABASE_URL; remove NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from local environment files.',
      );
    }
    expect(validateEnvironment({}, 'preview').errors).not.toEqual([]);
    expect(validateEnvironment({}, 'production').errors).not.toEqual([]);
  });

  it('accepts PostgreSQL loopback URLs with a database name and optional credentials', () => {
    for (const url of [
      local.DATABASE_URL,
      'postgres://localhost:55322/duo_ready',
      'postgresql://postgres:password@127.12.34.56:55322/duo_ready',
      'postgres://postgres:p%40ssword@[::1]:55322/duo_ready',
    ]) {
      expect(validateEnvironment({ DATABASE_URL: url }).errors).toEqual([]);
    }
  });

  it('rejects remote hosts, missing database names and connection override parameters', () => {
    for (const url of [
      'https://localhost:55322/duo_ready',
      'postgresql://db.example.com/duo_ready',
      'postgresql://localhost.evil.test/duo_ready',
      'postgresql://192.168.1.2/duo_ready',
      'postgresql://127.999.1.1/duo_ready',
      'postgresql://[::ffff:127.0.0.1]/duo_ready',
      'postgresql://localhost',
      'postgresql://localhost/',
      'postgresql://localhost/%20',
      'postgresql://localhost/duo_ready/extra',
      'postgresql://localhost/duo_ready%2Fextra',
      'postgresql://localhost/duo_ready%00',
      'postgresql://localhost/duo_ready?host=remote.example.com',
      'postgresql://localhost/duo_ready?sslmode=disable',
      'postgresql://localhost/duo_ready#fragment',
    ]) {
      const result = validateEnvironment({ DATABASE_URL: url });
      expect(result.errors, url).not.toEqual([]);
      expect(JSON.stringify(result)).not.toContain(url);
    }
  });

  it('requires separate Preview and production project references', () => {
    expect(validateEnvironment(hosted, 'preview').errors).toEqual([]);
    expect(
      validateEnvironment(
        { ...hosted, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt('anon') },
        'preview',
      ).errors,
    ).toEqual([]);
    expect(validateEnvironment(hosted, 'production').errors).not.toEqual([]);
    const production = {
      ...hosted,
      NEXT_PUBLIC_SUPABASE_URL: 'https://productionproject.supabase.co',
      DATABASE_URL: hosted.DATABASE_URL.replace('previewproject', 'productionproject'),
    };
    expect(validateEnvironment(production, 'production').errors).toEqual([]);
    expect(validateEnvironment(production, 'preview').errors).not.toEqual([]);
    expect(
      validateEnvironment({ ...hosted, SUPABASE_PRODUCTION_PROJECT_REF: '' }, 'preview').errors,
    ).not.toEqual([]);
  });

  it('rejects hosted URLs without an exact project hostname, site origin, or fixture isolation', () => {
    for (const url of [
      'http://previewproject.supabase.co',
      'https://previewproject.supabase.co.evil.test',
      'https://sub.previewproject.supabase.co',
      'https://previewproject.supabase.co:444',
      'https://previewproject.supabase.co/rest/v1',
    ]) {
      expect(
        validateEnvironment({ ...hosted, NEXT_PUBLIC_SUPABASE_URL: url }, 'preview').errors,
      ).not.toEqual([]);
    }
    for (const site of [
      '',
      'http://example.com',
      'https://example.com/ko',
      'https://user:password@example.com',
    ]) {
      expect(
        validateEnvironment({ ...hosted, NEXT_PUBLIC_SITE_URL: site }, 'preview').errors,
      ).not.toEqual([]);
    }
    expect(
      validateEnvironment({ ...hosted, LOCAL_FIXTURES: 'true' }, 'preview').errors,
    ).not.toEqual([]);
  });

  it('rejects secrets and database URLs in every public variable without revealing their values', () => {
    for (const key of [
      'sb_secret_do_not_print_me',
      jwt('service_role'),
      'postgres://reader:do_not_print_me@localhost/duo_ready',
      'postgresql://reader:do_not_print_me@localhost/duo_ready',
    ]) {
      const result = validateEnvironment({ ...local, NEXT_PUBLIC_EXTRA_KEY: key });
      expect(result.errors.some((error) => error.startsWith('NEXT_PUBLIC_EXTRA_KEY:'))).toBe(true);
      expect(JSON.stringify(result)).not.toContain(key);
      expect(
        validateEnvironment({ ...hosted, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }, 'preview')
          .errors,
      ).not.toEqual([]);
    }
    expect(
      validateEnvironment({ ...local, NEXT_PUBLIC_DATABASE_URL: local.DATABASE_URL }).errors,
    ).not.toEqual([]);
    for (const key of ['not-a-key', jwt('authenticated'), 'sb_publishable_']) {
      expect(
        validateEnvironment({ ...hosted, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }, 'preview')
          .errors,
      ).not.toEqual([]);
    }
  });

  it('resolves targets and rejects invalid or conflicting Vercel environments', () => {
    expect(validateEnvironment({ ...hosted, VERCEL_ENV: 'preview' }).target).toBe('preview');
    expect(validateEnvironment({}, 'unknown').errors).not.toEqual([]);
    expect(validateEnvironment({ VERCEL: '1' }).errors).not.toEqual([]);
    expect(validateEnvironment({ VERCEL: '1', VERCEL_ENV: 'development' }).errors).not.toEqual([]);
    expect(
      validateEnvironment({ ...hosted, VERCEL: '1', VERCEL_ENV: 'preview' }, 'local').errors,
    ).not.toEqual([]);
    expect(
      validateEnvironment({ ...hosted, VERCEL: '1', VERCEL_ENV: 'preview' }, 'production').errors,
    ).not.toEqual([]);
    expect(validateEnvironment({ ...hosted, VERCEL: '1', VERCEL_ENV: 'preview' }).errors).toEqual(
      [],
    );
  });
});

it('loads local environment files in Next.js precedence while preserving process environment', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'duo-ready-env-'));
  const script = fileURLToPath(new URL('../../scripts/check-env.mjs', import.meta.url));
  const env = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        ([name]) =>
          !name.startsWith('NEXT_PUBLIC_') &&
          !name.startsWith('VERCEL') &&
          !['DATABASE_URL', 'LOCAL_FIXTURES', '__NEXT_PROCESSED_ENV'].includes(name),
      ),
    ),
    NODE_ENV: 'development' as const,
  };
  try {
    writeFileSync(join(cwd, '.env'), 'DATABASE_URL=postgresql://wrong.example.com/duo_ready\n');
    writeFileSync(join(cwd, '.env.local'), `DATABASE_URL=${local.DATABASE_URL}\n`);
    const success = spawnSync(process.execPath, [script], { cwd, env, encoding: 'utf8' });
    expect(success.status, success.stderr).toBe(0);
    expect(success.stdout).toContain('PASS local: postgres-configured');
    const failure = spawnSync(process.execPath, [script], {
      cwd,
      env: {
        ...env,
        DATABASE_URL: 'postgresql://user:never_echo_this@wrong.example.com/duo_ready',
      },
      encoding: 'utf8',
    });
    expect(failure.status).toBe(1);
    expect(failure.stderr).toContain('DATABASE_URL');
    expect(failure.stdout + failure.stderr).not.toContain('never_echo_this');
    const invalidTarget = spawnSync(process.execPath, [script, '--target=unknown'], {
      cwd,
      env,
      encoding: 'utf8',
    });
    expect(invalidTarget.status).toBe(1);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

it('creates a private local PostgreSQL environment file once and never overwrites it', () => {
  const root = mkdtempSync(join(tmpdir(), 'duo-ready-db-env-'));
  const scripts = join(root, 'scripts');
  mkdirSync(join(scripts, 'lib'), { recursive: true });
  const script = join(scripts, 'local-db.mjs');
  copyFileSync(fileURLToPath(new URL('../../scripts/local-db.mjs', import.meta.url)), script);
  copyFileSync(
    fileURLToPath(new URL('../../scripts/lib/environment.mjs', import.meta.url)),
    join(scripts, 'lib', 'environment.mjs'),
  );
  try {
    const result = spawnSync(process.execPath, [script, 'env'], { cwd: root, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    const envFile = join(root, '.env.local');
    const content = readFileSync(envFile, 'utf8');
    expect(content).toContain(`DATABASE_URL="${local.DATABASE_URL}"`);
    expect(content).toContain('NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3000"');
    expect(content).toContain('LOCAL_FIXTURES="false"');
    expect(content).not.toContain('NEXT_PUBLIC_SUPABASE_');
    expect(statSync(envFile).mode & 0o777).toBe(0o600);
    expect(result.stdout + result.stderr).not.toContain(local.DATABASE_URL);

    const repeated = spawnSync(process.execPath, [script, 'env'], { cwd: root, encoding: 'utf8' });
    expect(repeated.status).toBe(1);
    expect(repeated.stderr).toContain('already exists; no changes made');
    expect(readFileSync(envFile, 'utf8')).toBe(content);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('hosted tools use a separate private file and never consume Next production env files', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'duo-hosted-config-'));
  const moduleUrl = new URL('../../scripts/lib/hosted.mjs', import.meta.url).href;
  const config = {
    ...hosted,
    NEXT_PUBLIC_SUPABASE_URL: 'https://productionproject.supabase.co',
    DATABASE_URL: hosted.DATABASE_URL.replace('previewproject', 'productionproject'),
  };
  const text = Object.entries(config)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('\n');
  const code = `import {loadHosted} from ${JSON.stringify(moduleUrl)}; try {loadHosted({target:'production','project-ref':'productionproject'}); console.log('PASS');} catch {process.exitCode=1;}`;
  try {
    writeFileSync(join(cwd, '.env.production.local'), text, { mode: 0o600 });
    expect(
      spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd, encoding: 'utf8' })
        .status,
    ).toBe(1);
    writeFileSync(join(cwd, '.env.hosted.production.local'), text, { mode: 0o600 });
    expect(
      spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd, encoding: 'utf8' })
        .status,
    ).toBe(0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
