import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

type Environment = Record<string, string | undefined>;
export function localAuthConfig(env: Environment, host: string) {
  if (env.NODE_ENV === 'production' || env.VERCEL !== undefined || env.LOCAL_ADMIN_AUTH !== 'true')
    return null;
  try {
    const hostname = new URL(`http://${host}`).hostname;
    const db = new URL(env.DATABASE_URL ?? '');
    if (
      ![hostname, db.hostname].every((name) => ['localhost', '127.0.0.1', '[::1]'].includes(name))
    )
      return null;
    if (!['postgres:', 'postgresql:'].includes(db.protocol) || db.search || db.hash) return null;
  } catch {
    return null;
  }
  const userId = env.LOCAL_ADMIN_USER_ID ?? '';
  const email = env.LOCAL_ADMIN_EMAIL ?? '';
  const password = env.LOCAL_ADMIN_PASSWORD ?? '';
  if (
    !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(userId) ||
    !email.includes('@') ||
    password.length < 16
  )
    return null;
  return { userId, email, password };
}

type Session = { userId: string; expires: number };
const localState = globalThis as unknown as { duoLocalSessions?: Map<string, Session> };
function sessions() {
  return (localState.duoLocalSessions ??= new Map());
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export function equalCredential(a: string, b: string) {
  return timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}

export function newLocalSession(userId: string, now = Date.now()) {
  for (const [key, session] of sessions()) if (session.expires <= now) sessions().delete(key);
  const token = randomBytes(32).toString('base64url');
  sessions().set(hash(token), { userId, expires: now + 60 * 60 * 1000 });
  return token;
}

export function localSessionActor(
  token: string | undefined,
  expectedUserId: string,
  now = Date.now(),
) {
  if (!token) return null;
  const session = sessions().get(hash(token));
  if (!session || session.expires <= now || session.userId !== expectedUserId) return null;
  return session.userId;
}

export function revokeLocalSession(token: string | undefined) {
  if (token) sessions().delete(hash(token));
}
