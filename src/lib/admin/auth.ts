import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { database, hostedSessionActive } from '@/lib/db/server';
import { verifiedSessionId } from './hosted-session.ts';
import { createAuthClient } from '@/lib/supabase/auth';
import { localAuthConfig, localSessionActor } from './local-auth';
import type { Locale } from '@/lib/directory/types';

export const LOCAL_SESSION_COOKIE = 'duo-local-admin';
export class AdminError extends Error {
  constructor(public code: 'authRequired' | 'forbidden' | 'unavailable') {
    super(code);
  }
}

export async function localConfiguration() {
  return localAuthConfig(process.env, (await headers()).get('host') ?? '');
}

export async function verifiedActor() {
  const local = await localConfiguration();
  if (local)
    return localSessionActor((await cookies()).get(LOCAL_SESSION_COOKIE)?.value, local.userId);
  const client = await createAuthClient();
  if (!client) return null;
  // getSession supplies a token, not authorization. Verify that exact token with getUser.
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const token = sessionData.session?.access_token;
  if (sessionError || !token) return null;
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const sessionId = verifiedSessionId(token, data.user.id);
  if (!sessionId) return null;
  return (await hostedSessionActive(sessionId, data.user.id)) ? data.user.id : null;
}

export async function assertAdmin() {
  const actor = await verifiedActor();
  if (!actor) throw new AdminError('authRequired');
  try {
    const allowed = await database(
      actor,
      async (db) => (await db.query('SELECT app_private.is_admin() AS allowed')).rows[0]?.allowed,
    );
    if (!allowed) throw new AdminError('forbidden');
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError('unavailable');
  }
  return actor;
}

export async function requireAdmin(locale: Locale) {
  try {
    return await assertAdmin();
  } catch (error) {
    if (error instanceof AdminError) redirect(`/${locale}/admin/login?error=${error.code}`);
    throw error;
  }
}
