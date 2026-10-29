import { supabaseCA } from './supabase-ca.mjs';

export function connectionOptions(connectionString) {
  const url = new URL(connectionString);
  if (/^(?:db\.[a-z0-9]+\.supabase\.co|[a-z0-9.-]+\.pooler\.supabase\.com)$/.test(url.hostname)) {
    if (url.searchParams.get('sslmode') !== 'verify-full' || [...url.searchParams].length !== 1)
      throw new Error('Hosted database requires verified TLS without connection overrides.');
    // pg's connection-string SSL settings override explicit ssl options. Remove only the
    // validated mode and supply its equivalent with the provider CA and hostname checking.
    url.search = '';
    return { connectionString: url.toString(), ssl: { ca: supabaseCA, rejectUnauthorized: true } };
  }
  return { connectionString };
}
