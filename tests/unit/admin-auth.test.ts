import { describe, expect, test } from 'vitest';
import {
  localAuthConfig,
  newLocalSession,
  localSessionActor,
  revokeLocalSession,
  equalCredential,
} from '@/lib/admin/local-auth';

const userId = '00000000-0000-4000-8000-000000000001';
const env = {
  NODE_ENV: 'test',
  LOCAL_ADMIN_AUTH: 'true',
  DATABASE_URL: 'postgresql://localhost/test',
  LOCAL_ADMIN_USER_ID: userId,
  LOCAL_ADMIN_EMAIL: 'test@example.invalid',
  LOCAL_ADMIN_PASSWORD: 'test-only-long-password',
};

describe('explicit local development authentication boundary', () => {
  test('requires every explicit setting and both loopback request and database', () => {
    expect(localAuthConfig(env, '127.0.0.1:3000')?.userId).toBe(userId);
    for (const change of [
      { NODE_ENV: 'production' },
      { VERCEL: '1' },
      { LOCAL_ADMIN_AUTH: 'false' },
      { LOCAL_ADMIN_PASSWORD: '' },
      { LOCAL_ADMIN_USER_ID: 'invalid' },
      { DATABASE_URL: 'postgresql://remote.example/test' },
      { DATABASE_URL: 'postgresql://localhost/test?host=remote' },
    ]) {
      expect(localAuthConfig({ ...env, ...change }, 'localhost:3000')).toBeNull();
    }
    expect(localAuthConfig(env, 'production.example')).toBeNull();
  });
  test('opaque sessions reject forgery, expire and are revoked on logout', () => {
    const token = newLocalSession(userId, 1000);
    expect(localSessionActor(token, userId, 2000)).toBe(userId);
    expect(localSessionActor('forged', userId, 2000)).toBeNull();
    expect(localSessionActor(token, 'other-user', 2000)).toBeNull();
    expect(localSessionActor(token, userId, 3601001)).toBeNull();
    revokeLocalSession(token);
    expect(localSessionActor(token, userId, 2000)).toBeNull();
    expect(equalCredential('different', env.LOCAL_ADMIN_PASSWORD)).toBe(false);
    expect(equalCredential(env.LOCAL_ADMIN_PASSWORD, env.LOCAL_ADMIN_PASSWORD)).toBe(true);
  });
});
