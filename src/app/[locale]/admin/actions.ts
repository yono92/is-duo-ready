'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import {
  AdminError,
  assertAdmin,
  LOCAL_SESSION_COOKIE,
  localConfiguration,
} from '@/lib/admin/auth';
import { equalCredential, newLocalSession, revokeLocalSession } from '@/lib/admin/local-auth';
import { InputError, parseDraft, uuid, revision } from '@/lib/admin/input';
import { reviewAdminApp, saveAdminApp } from '@/lib/admin/repository';
import { createAuthClient } from '@/lib/supabase/auth';
import { database } from '@/lib/db/server';

export type ActionState = { error?: string };
function errorCode(error: unknown) {
  if (error instanceof AdminError) return error.code;
  if (error instanceof InputError) return 'invalid';
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  return code === '40001'
    ? 'conflict'
    : code === '23505'
      ? 'duplicate'
      : ['23514', '23502', '22P02', '22007', '22008'].includes(String(code))
        ? 'invalid'
        : code === '42501'
          ? 'forbidden'
          : 'unavailable';
}

export async function loginAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  const locale = await getLocale();
  const email = String(form.get('email') ?? '')
    .trim()
    .slice(0, 254);
  const password = String(form.get('password') ?? '');
  if (!email || password.length > 1024 || !password) return { error: 'authInvalid' };
  let actor: string | null = null;
  const local = await localConfiguration();
  const client = local ? null : await createAuthClient(true);
  try {
    if (local) {
      if (!equalCredential(email, local.email) || !equalCredential(password, local.password))
        return { error: 'authInvalid' };
      actor = local.userId;
    } else if (client) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) return { error: 'authInvalid' };
      actor = data.user.id;
    } else return { error: 'authUnavailable' };
    const allowed = await database(
      actor,
      async (db) => (await db.query('SELECT app_private.is_admin() AS allowed')).rows[0].allowed,
    );
    if (!allowed) {
      await client?.auth.signOut({ scope: 'local' });
      return { error: 'forbidden' };
    }
    if (local)
      (await cookies()).set(LOCAL_SESSION_COOKIE, newLocalSession(actor!), {
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
        path: '/',
        maxAge: 3600,
      });
  } catch {
    await client?.auth.signOut({ scope: 'local' }).catch(() => {});
    return { error: 'unavailable' };
  }
  redirect(`/${locale}/admin/apps`);
}

export async function logoutAction() {
  const locale = await getLocale();
  const store = await cookies();
  revokeLocalSession(store.get(LOCAL_SESSION_COOKIE)?.value);
  store.delete(LOCAL_SESSION_COOKIE);
  const client = await createAuthClient(true);
  if (client) await client.auth.signOut({ scope: 'local' });
  redirect(`/${locale}/admin/login`);
}

export async function saveAppAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  const locale = await getLocale();
  let id: string;
  try {
    const actor = await assertAdmin();
    const payload = parseDraft(form.get('payload'));
    id = (await saveAdminApp(actor, payload)).id;
  } catch (error) {
    return { error: errorCode(error) };
  }
  revalidatePath(`/${locale}/admin/apps`);
  redirect(`/${locale}/admin/apps/${id}?saved=1`);
}

export async function reviewAppAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const locale = await getLocale();
  let result: { id: string; slug: string };
  try {
    const actor = await assertAdmin();
    if (form.get('confirmed') !== 'on') throw new InputError('invalid');
    const reason = String(form.get('reason') ?? '').trim();
    if (!reason || reason.length > 4000) throw new InputError('invalid');
    const action = form.get('action');
    if (action !== 'publish' && action !== 'archive') throw new InputError('invalid');
    result = await reviewAdminApp(
      actor,
      uuid(form.get('id')),
      revision(Number(form.get('revision'))),
      reason,
      action === 'archive',
    );
  } catch (error) {
    return { error: errorCode(error) };
  }
  for (const lang of ['ko', 'en']) {
    revalidatePath(`/${lang}`);
    revalidatePath(`/${lang}/apps/[slug]`, 'page');
    revalidatePath(`/${lang}/updates`);
    revalidatePath(`/${lang}/admin/apps`);
  }
  revalidatePath('/sitemap.xml');
  redirect(`/${locale}/admin/apps/${result.id}?reviewed=1`);
}
