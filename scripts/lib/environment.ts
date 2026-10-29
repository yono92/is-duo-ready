import { isIP } from 'node:net';

const targets = ['local', 'preview', 'production'];

function jwtRole(value: string) {
  const parts = value.split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role ?? null;
  } catch {
    return null;
  }
}

function isSecret(value: string) {
  return (
    value.startsWith('sb_secret_') ||
    jwtRole(value) === 'service_role' ||
    /^postgres(?:ql)?:/i.test(value)
  );
}

function parseOrigin(value: string) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

function isLocalDatabaseUrl(value: string) {
  try {
    const url = new URL(value);
    const loopback =
      ['localhost', '[::1]'].includes(url.hostname.toLowerCase()) ||
      (isIP(url.hostname) === 4 && url.hostname.startsWith('127.'));
    const database = decodeURIComponent(url.pathname.slice(1));
    // Query parameters can override the connection host in node-postgres.
    return (
      ['postgres:', 'postgresql:'].includes(url.protocol) &&
      loopback &&
      Boolean(database.trim()) &&
      !database.includes('/') &&
      !/[\u0000-\u001f\u007f]/.test(database) &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

/** String-contract validation only; this does not connect to or authenticate with any service.
 */
export function validateEnvironment(
  env: Record<string, string | undefined>,
  requestedTarget?: string,
) {
  const target = requestedTarget ?? env.VERCEL_ENV ?? 'local';
  const errors = [];
  if (!targets.includes(target)) {
    errors.push('target: use local, preview, or production.');
  }
  if (env.VERCEL !== undefined) {
    if (!['preview', 'production'].includes(env.VERCEL_ENV ?? '')) {
      errors.push('VERCEL_ENV: Vercel requires preview or production.');
    }
    if (target === 'local' || target !== env.VERCEL_ENV) {
      errors.push('target: must match VERCEL_ENV on Vercel; local is not permitted.');
    }
  }
  for (const [name, value] of Object.entries(env)) {
    if (
      name.startsWith('NEXT_PUBLIC_') &&
      value?.trim() &&
      (name === 'NEXT_PUBLIC_DATABASE_URL' || isSecret(value.trim()))
    ) {
      errors.push(
        `${name}: database URLs, secret keys and service_role credentials must never be public.`,
      );
    }
  }

  const urlValue = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
  const configured = Boolean(urlValue && key);
  const databaseUrl = env.DATABASE_URL?.trim() ?? '';
  const dataSource = env.DIRECTORY_DATA_SOURCE?.trim() || 'fixtures';
  if (!['fixtures', 'postgres'].includes(dataSource))
    errors.push('DIRECTORY_DATA_SOURCE: use fixtures or postgres.');
  if (dataSource === 'postgres' && !databaseUrl)
    errors.push('DATABASE_URL: required for postgres directory mode.');
  const url = parseOrigin(urlValue);
  if (target === 'local') {
    if (urlValue || key) {
      errors.push(
        'Local PostgreSQL uses DATABASE_URL; remove NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from local environment files.',
      );
    }
    if (databaseUrl && !isLocalDatabaseUrl(databaseUrl)) {
      errors.push(
        'DATABASE_URL: local requires postgres:// or postgresql:// with a loopback host and database name, without query parameters or fragments.',
      );
    }
  } else if (target === 'preview' || target === 'production') {
    if (dataSource !== 'postgres')
      errors.push('DIRECTORY_DATA_SOURCE: hosted targets require postgres.');
    if (env.ICON_STORAGE_PROVIDER !== 'supabase')
      errors.push('ICON_STORAGE_PROVIDER: hosted targets require supabase.');
    if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(env.SUPABASE_STORAGE_BUCKET ?? ''))
      errors.push('SUPABASE_STORAGE_BUCKET: a valid private bucket name is required.');
    const storageKey = env.SUPABASE_SECRET_KEY?.trim() ?? '';
    if (!/^sb_secret_[A-Za-z0-9_-]+$/.test(storageKey) && jwtRole(storageKey) !== 'service_role')
      errors.push('SUPABASE_SECRET_KEY: a server-only secret or service_role key is required.');
    if (env.LOCAL_ADMIN_AUTH?.trim().toLowerCase() === 'true')
      errors.push('LOCAL_ADMIN_AUTH: must not be true for hosted targets.');
    if (Boolean(urlValue) !== Boolean(key)) {
      errors.push(
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: set both or neither.',
      );
    }
    if (key && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && jwtRole(key) !== 'anon') {
      errors.push(
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: expected a publishable key or legacy anon JWT.',
      );
    }
    if (!configured) {
      errors.push(
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: required for hosted targets.',
      );
    }
    const project = url?.hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
    if (!url || url.protocol !== 'https:' || url.port || !project) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL: expected an HTTPS project-ref.supabase.co origin.');
    }
    if (dataSource === 'postgres' && databaseUrl) {
      let valid = false;
      try {
        const db = new URL(databaseUrl);
        const direct = db.hostname === `db.${project}.supabase.co` && db.username === 'postgres';
        const pooler =
          /^(?:[a-z0-9-]+\.)+pooler\.supabase\.com$/.test(db.hostname) &&
          decodeURIComponent(db.username) === `postgres.${project}`;
        valid =
          ['postgres:', 'postgresql:'].includes(db.protocol) &&
          Boolean(db.password) &&
          (direct || pooler) &&
          db.pathname === '/postgres' &&
          !db.hash &&
          db.searchParams.get('sslmode') === 'verify-full' &&
          [...db.searchParams.keys()].length === 1;
      } catch {
        /* Report only variable name, never the connection string. */
      }
      if (!valid)
        errors.push(
          'DATABASE_URL: use the matching Supabase direct or pooler connection with sslmode=verify-full; connection overrides are not allowed.',
        );
    }
    const site = parseOrigin(env.NEXT_PUBLIC_SITE_URL?.trim() ?? '');
    if (!site || site.protocol !== 'https:') {
      errors.push('NEXT_PUBLIC_SITE_URL: an HTTPS origin is required for hosted targets.');
    }
    if (env.LOCAL_FIXTURES?.trim().toLowerCase() === 'true') {
      errors.push('LOCAL_FIXTURES: must not be true for hosted targets.');
    }
    const productionRef = env.SUPABASE_PRODUCTION_PROJECT_REF?.trim() ?? '';
    const previewRef = env.SUPABASE_PREVIEW_PROJECT_REF?.trim() ?? '';
    if (
      previewRef &&
      (!/^[a-z0-9]+$/.test(previewRef) || (target === 'preview' && project !== previewRef))
    )
      errors.push('SUPABASE_PREVIEW_PROJECT_REF: must match the Preview project.');
    if (target === 'production' && project && project === previewRef)
      errors.push('NEXT_PUBLIC_SUPABASE_URL: production must not use the Preview project.');
    // A dedicated, explicitly identified Preview can be prepared before Production exists.
    if (!productionRef && target === 'preview' && project === previewRef) {
      // Production remains blocked until its own reference is configured.
    } else if (!/^[a-z0-9]+$/.test(productionRef)) {
      errors.push(
        'SUPABASE_PRODUCTION_PROJECT_REF: a lowercase alphanumeric project reference is required.',
      );
    } else if (project) {
      if (target === 'preview' && project === productionRef) {
        errors.push(
          'NEXT_PUBLIC_SUPABASE_URL: Preview must use a different project from SUPABASE_PRODUCTION_PROJECT_REF.',
        );
      }
      if (target === 'production' && project !== productionRef) {
        errors.push(
          'NEXT_PUBLIC_SUPABASE_URL: production must match SUPABASE_PRODUCTION_PROJECT_REF.',
        );
      }
    }
  }
  const mode =
    target === 'local'
      ? databaseUrl
        ? 'postgres-configured'
        : 'ui-only'
      : configured
        ? 'supabase-configured'
        : 'ui-only';
  return { target, mode, errors };
}
