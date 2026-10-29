import { describe, expect, it } from 'vitest';
import { connectionOptions } from '../../src/lib/db/connection.ts';

describe('hosted PostgreSQL TLS', () => {
  it('keeps certificate and hostname verification with the official CA', () => {
    const config = connectionOptions(
      'postgresql://postgres.preview:private@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=verify-full',
    );
    expect(config.ssl?.rejectUnauthorized).toBe(true);
    expect(config.ssl?.ca).toContain('BEGIN CERTIFICATE');
    expect(config.ssl).not.toHaveProperty('checkServerIdentity');
    expect(new URL(config.connectionString).search).toBe('');
  });
  it('rejects downgraded TLS or injected connection options and preserves local sockets', () => {
    const base = 'postgresql://postgres:p@db.preview.supabase.co/postgres';
    for (const query of ['', '?sslmode=require', '?sslmode=verify-full&host=attacker.invalid'])
      expect(() => connectionOptions(base + query)).toThrow();
    const local = 'postgresql://localhost/local';
    expect(connectionOptions(local)).toEqual({ connectionString: local });
  });
});
